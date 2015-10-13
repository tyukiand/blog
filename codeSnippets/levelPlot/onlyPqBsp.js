// requires:
//  <script src="quasiPriorityQueue.js"></script>
//  <script src="quadraticFractals.js"></script>
//  <script src="functions.js"></script>

// the contexts will be initialized as soon as all DOM elements are loaded
var juliaCtx = null; 
var juliaBuffer = null;

// functions for converting between screen and world-coordinates
// (simple, because both canvases are squares centered at 0)
var halfScreen = 300;
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
var maxIters = 20;
var bailOutSq = 9;
var cRe = 0.0;
var cIm = 0.0;

/** Draws a single rectangular patch */
function drawPatch(patch) {
  // for julia-sets, taking the maximum value of the values on vertices
  // seems appropriate. For other functions, one might consider taking
  // the mean or something else.
  var maxValue = Math.max(
    Math.max(patch.values[0], patch.values[1]),
    Math.max(patch.values[2], patch.values[3])
  );
  if (maxValue == maxIters) {
    juliaCtx.fillStyle = "rgb(0,0,0)";
  } else {
    var rgb = numberToColor(maxValue, palette);
    juliaCtx.fillStyle = 
      "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
  }
  juliaCtx.fillRect(
    patch.screnRect.left, patch.screnRect.bottom,
    patch.screnRect.width, patch.screnRect.height
  );
}

/**
 * Computes and paints a Julia set on `juliaCanvas`.
 * Sets cIm and cRe.
 */
function drawJuliaSet(c_real, c_im) {
  
  // DEBUG: draw a big square in the background
  juliaCtx.fillStyle = "rgb(0,0,128)";
  juliaCtx.fillRect(0,0,canvasSize,canvasSize);

  // use the quasi-priority queue to create a todo-list in such a 
  // way that the interesting regions are computed first
  var queue = new QuasiPriorityQueue(maxIters * 4, 0, 20);
  var entireArea = new FunctionPatch(
    new Rect(-halfWorld, halfWorld, -halfWorld, halfWorld),
    new Rect(0, canvasSize, 0, canvasSize),
    [0,0,0,0]
  )
  queue.enqueue(entireArea, 0);

  var jobs = [];

  while(!queue.isEmpty()) {
    // draws intermediate state of the queue, looks kind of cool
    if (queue.size + jobs.length > 500) {
      juliaCtx.fillStyle = "rgb(0,0,0)";
      juliaCtx.fillRect(0,0,canvasSize, canvasSize)
      queue.foreach(function(patch){
        juliaCtx.fillStyle = 
          "rgb(" + 
            Math.floor(Math.random() * 255) + "," + 
            Math.floor(Math.random() * 255) +
          ",0)"
        juliaCtx.fillRect(
          patch.screnRect.left,
          patch.screnRect.bottom,
          patch.screnRect.width,
          patch.screnRect.height
        );          
      });
      return;
    }
    // */
    var head = queue.dequeue();
    if (head.screnRect.area <= 64) {
      // todo: paint it black?
      jobs.push(head);
    } else {
      var ab = head.subdivide(function(x,y) {
        return quadraticFractalIteration(
          x, y, c_real, c_im, maxIters, bailOutSq
        );
      });
      var a = ab[0];
      var b = ab[1];
      var aValue = cyclicTotalVariation(a.values);
      var bValue = cyclicTotalVariation(b.values);
      queue.enqueue(a, aValue);
      queue.enqueue(b, bValue);
    }
  }
}

function juliaCanvas_move(event) {
  // copy-pasted from here: 
  // http://stackoverflow.com/questions/29522895/javascript-track-mouse-position-within-video
  var rect = this.getBoundingClientRect();  // absolute position of element
  var x = event.clientX - rect.left;        // adjust for x
  var y = event.clientY - rect.top;         // adjust for y
  drawJuliaSet(toWorld(x), toWorld(y));
}

function juliaCanvas_leave(event) {
  drawJuliaSet(-1, 0);
}

function init(halfScreenSize) {

  if (halfScreenSize) {
    halfScreen = halfScreenSize;
    canvasSize = 2 * halfScreen + 1;
    halfWorld = 2.0;
    factorWorldToScreen = halfScreen / halfWorld;
    factorScreenToWorld = halfWorld / halfScreen;
  }
  
  var juliaCanvas = document.getElementById("juliaCanvas");
  juliaCtx = juliaCanvas.getContext("2d");
  juliaCanvas.width =  canvasSize;
  juliaCanvas.height = canvasSize;
  var juliaCanvasCaption = document.getElementById("juliaCanvasCaption");
  juliaCanvasCaption.style = "width: " + canvasSize + "px;";
  juliaCanvas.onmousemove = juliaCanvas_move;
  juliaCanvas.onmouseleave = juliaCanvas_leave;
  juliaBuffer = juliaCtx.getImageData(0,0,canvasSize, canvasSize);
  drawJuliaSet(-1, 0);
}
