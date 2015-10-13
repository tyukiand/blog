// Search for the string `EDIT` to get to the relevant part
onmessage = function(msg) {

  // This is what is posted as message to the workers
  var data  = msg.data;
  var id = data.id;                // should be sent back in the answer
  var param = data.param;          // use for computation, sent it back 
  var screnRect = data.screnRect;  // pixel-dims. sent it back in the answer
  var worldRect = data.worldRect;  // which part are you computing
  // whatever you passed as painting settings to
  // the Plot constructor, it's passed to your workers
  var paintingSettings = data.paintingSettings;

  // this is a basic setup of the result array
  var sw = screnRect.width;
  var sh = screnRect.height;
  var pixels = new Uint8ClampedArray(sw * sh * 4);

  // here are a few helper variables that are 
  // useful for generating (x,y)-values for each pixel
  var dx = worldRect.width / (sw - 1);
  var dy = worldRect.height / (sh - 1);

  var x = worldRect.left;
  var y = worldRect.bottom;
  var red = 0;
  var green = 0;
  var blue = 0;
  var ptr = 0;

  // [1/2] BEGIN EDITING HERE (optional) extract some variables from 
  // `paintingSettings` and `param`, if you want
  var palette = paintingSettings.palette;
  var numColors = palette.red.length;
  var maxIters = paintingSettings.maxIters;
  var bailOutSq = paintingSettings.bailOut * paintingSettings.bailOut;
  var cRe = param.re;
  var cIm = param.im;
  // [1/2] END EDITING HERE

  // here is a loop that walks through all the pixels
  for (var row = 0; row < sh; row++) {
    x = worldRect.left;
    for (var column = 0; column < sw; column++) {
      /* [2/2] BEGIN EDITING HERE */
      var re = x;
      var im = y;
      var reSq = re * re;
      var imSq = im * im;
      var iter = 0;
      while ((reSq + imSq <= bailOutSq) && (iter < maxIters)) {
        im = 2 * re * im + cIm;
        re = reSq - imSq + cRe;
        reSq = re * re;
        imSq = im * im;
        iter++;
      }

      // copy-pasted from palette.js, with minor optimizations...
      // (yes, that's bit rot)
      var red = 0;
      var green = 0;
      var blue = 0;
      for (var p = 0; p < numColors; p++) {
        var dist = iter - palette.position[p];
        var colorFactor = 
          1.0 / (1 + palette.sharpness[p] * dist * dist);
        red += colorFactor * palette.red[p];
        green += colorFactor * palette.green[p];
        blue += colorFactor * palette.blue[p];
      }

      /* [2/2] END EDITING HERE */
      pixels[ptr++] = red;
      pixels[ptr++] = green;
      pixels[ptr++] = blue;
      pixels[ptr++] = 255;

      x += dx;
    }
    y += dy;
  }

  // Return the result to main thread
  postMessage({
    id: id,
    param: param,
    screnRect : screnRect,
    pixels: pixels
  });
}