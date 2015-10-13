/* requires palette.js */
/* requires levelPlot.js */
/* requires a global variable SCRIPTS_PATH (generated by Jekyll or however) */
function init(halfScreenWidth) {

  // coordinate systems
  var halfScreen = halfScreenWidth;
  var canvasSize = 2 * halfScreen + 1;
  var halfWorld = 2.0;
  var factorWorldToScreen = halfScreen / halfWorld;
  var factorScreenToWorld = halfWorld / halfScreen;
  function toScreen(world) {
    return world * factorWorldToScreen + halfScreen;
  }
  function toWorld(screen) {
    return (screen - halfScreen) * factorScreenToWorld;
  }
  
  /* Global settings for both plots */
  var maxIters = 100;
  var bailOut = 3;
  var bailOutSq = bailOut * bailOut;
  var chosen_cRe = -0.8;
  var chosen_cIm = 0.156;
  var palette = calmPaleBlue(maxIters);

  // bunch of canvases and contexts (initialized below)
  var juliaCanvas = null;
  var juliaCtx = null; 
  var juliaResponsivePlot = null;
  var mandelbrotCanvas = null;
  var mandelbrotCtx = null;
  var mandelbrotBackBuffer = null;

  /** 
   * Computes `F_c(z)` with specified number of maximum iterations,
   * and square of the bail-out radius. Here, `c = cx + i cy`, `z = x + i y`
   */
  function quadraticFractalIteration(x, y, cx, cy, maxIters, bailOutSq) {
    var xSq = x * x;
    var ySq = y * y;
    var iter = 0;
    
    while ((xSq + ySq <= bailOutSq) && (iter < maxIters)) {
      y = 2 * x * y + cy;
      x = xSq - ySq + cx;
      xSq = x * x;
      ySq = y * y;
      iter++;
    }
  
    return iter;
  }
  
  /** Computes first points on the orbit of (x,y) */
  function orbit(x, y, cx, cy, iters) {
    var res = new Array();
    res.push({re: x, im: y});
    for (i = 0; i < iters; i++) {
      var newX = x * x - y * y + cx;
      y = 2 * x * y + cy;
      x = newX;
      if (x * x + y * y < 100) {
        res.push({re: x, im: y});
      }
    }
    return res;
  }
  
  /** Compute the mandelbrot set, save it to a back-buffer */
  function computeMandelbrot() {
    var data = mandelbrotBackBuffer.data;
    var ptr = 0;
    for (var r = 0; r < canvasSize; r++) {
      for (var c = 0; c < canvasSize; c++) {
        var x = toWorld(c);
        var y = toWorld(r);
        var value = 
          quadraticFractalIteration(0, 0, x, y, maxIters, 4.0);
        var rgb  = numberToColor(value, palette);
        data[ptr++] = rgb[0];
        data[ptr++] = rgb[1];
        data[ptr++] = rgb[2];
        data[ptr++] = 255;
      }
    }
  }
  
  /** Copy the back-buffer to the visible canvas */
  function showMandelbrot() {
    mandelbrotCtx.putImageData(mandelbrotBackBuffer, 0, 0);
  }

  function mandelbrotCanvas_move(event) {
    // copy-pasted from here: 
    // http://stackoverflow.com/questions/29522895/javascript-track-mouse-position-within-video
    var rect = this.getBoundingClientRect();  // absolute position of element
    var x = event.clientX - rect.left;        // adjust for x
    var y = event.clientY - rect.top;         // adjust for y
    var re = toWorld(x);
    var im = toWorld(y);
    juliaResponsivePlot.redraw('visible', {re: re, im: im});
  }
  
  function mandelbrotCanvas_leave(event) {
    juliaResponsivePlot.redraw('visible', {re: chosen_cRe, im: chosen_cIm});
  }
  
  function mandelbrotCanvas_click(event) {
    var rect = this.getBoundingClientRect();  // absolute position of element
    var x = event.clientX - rect.left;        // adjust for x
    var y = event.clientY - rect.top;         // adjust for y
    chosen_cRe = toWorld(x);
    chosen_cIm = toWorld(y);
    showMandelbrot();
    mandelbrotCtx.fillStyle = "rgb(255,255,0)";
    mandelbrotCtx.fillRect(x - 1, y - 1, 3, 3);
    juliaResponsivePlot.redraw('chosen', {re: chosen_cRe, im: chosen_cIm});
  }
  
  function juliaCanvas_click(event) {
    var rect = this.getBoundingClientRect();  // absolute position of element
    var x = event.clientX - rect.left;        // adjust for x
    var y = event.clientY - rect.top;         // adjust for y
    var re = toWorld(x);
    var im = toWorld(y);
    juliaResponsivePlot.show('chosen');
    juliaCtx.strokeStyle = "rgb(250,200,0)";
    juliaCtx.fillStyle = "rgb(255,255,0)";
    var orb = orbit(re, im, chosen_cRe, chosen_cIm, 100);
    for (var i = 1; i < orb.length; i++) {
      var prevx = toScreen(orb[i - 1].re);
      var prevy = toScreen(orb[i - 1].im);
      var currx = toScreen(orb[i].re);
      var curry = toScreen(orb[i].im);
      juliaCtx.beginPath();
      juliaCtx.moveTo(prevx, prevy);
      juliaCtx.lineTo(currx, curry);
      juliaCtx.stroke();
      juliaCtx.fillRect(currx - 1, curry - 1, 3, 3);
    }
  }
  
  // connect the above code to the actual canvases in the DOM
  mandelbrotCanvas = document.getElementById("mandelbrotCanvas");
  juliaCanvas = document.getElementById("juliaCanvas");
  mandelbrotCtx = mandelbrotCanvas.getContext("2d");
  juliaCtx = juliaCanvas.getContext("2d");

  // set canvas sizes
  mandelbrotCanvas.width = canvasSize;
  mandelbrotCanvas.height = canvasSize;
  juliaCanvas.width =  canvasSize;
  juliaCanvas.height = canvasSize;

  // attach listeners
  mandelbrotCanvas.onmousemove = mandelbrotCanvas_move;
  mandelbrotCanvas.onmouseleave = mandelbrotCanvas_leave;
  mandelbrotCanvas.onclick = mandelbrotCanvas_click;
  juliaCanvas.onclick = juliaCanvas_click;

  // create ImageData for the Mandelbrot set
  mandelbrotBackBuffer = mandelbrotCtx.getImageData(0,0,canvasSize, canvasSize);
  computeMandelbrot();
  showMandelbrot();

  // create responsive level plot for julia sets
  juliaResponsivePlot = new levelPlot.Plot(
    function(p) {
      return function(x, y) {
        return quadraticFractalIteration(x, y, p.re, p.im, maxIters, bailOutSq);
      };
    },
    SCRIPTS_PATH + "juliaSetWebWorker.js",
    -2, 2, -2, 2,
    levelPlot.realCyclicVariation,
    0, maxIters * 4,
    "juliaCanvas",
    {
      palette : palette,
      maxIters : maxIters,
      bailOut : bailOut
    }
  );

  juliaResponsivePlot.redraw('visible', {re: chosen_cRe, im: chosen_cIm});
}