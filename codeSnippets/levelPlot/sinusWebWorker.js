// Search for the string `EDIT` to get to the relevant part
onmessage = function(msg) {

  // This is what is passed to the workers
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

  // here is a loop that walks through all the pixels
  for (var row = 0; row < sh; row++) {
    x = worldRect.left;
    for (var column = 0; column < sw; column++) {
      /* BEGIN EDITING HERE */
      // Make sure that there are no conflicts with the variables
      // declared above.
      // 
      // take the two double values (x, y), your `param`, your 
      // `paintingSettings`, and produce three values `red`, `green` and 
      // `blue` somehow.
      
      // Simple example: weird radially symmetric sinus wave
      var rad1 = Math.hypot(
        x - param.centerX, 
        y - param.centerY
      );
      var rad2 = Math.hypot(
        x + param.centerX,
        y + param.centerY
      ) ;
      var z = Math.sin(5 * rad1) / (1 + rad1) + Math.sin(5 * rad2) / (1 + rad2);
      var gray = Math.max(Math.min(255, (z + 1) / 2 * 255), 0);
      var red = 0;
      var green = 255-gray;
      var blue = 100 + 155 * gray / 255;

      /* END EDITING HERE */
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