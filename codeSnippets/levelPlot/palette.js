/* Function that generates a palette depending on the maximum value of a function */
function calmPaleBlue(maxValue) {
  return {
    position :  [0,   5,   9,   15,   40, 80,  maxValue],
    sharpness : [0.05,0.3, 0.3, 0.3,  0.01, 0.01, 1],
    red :       [255, 0,   150, 0,    50,   200,0],
    green :     [255, 0,   180, 200,  100,  200,0],
    blue :      [255, 0,   255,   100,  150,  250,0]
  };
}

/*
 * Converts a function value to RGB, using the above palette.
 * The numbers are integers, but they are not clamped to [0,.., 255].
 */
function numberToColor(value, palette) {
  var numColors = palette.red.length;
  var red = 0;
  var green = 0;
  var blue = 0;
  for (var p = 0; p < numColors; p++) {
    var dist = value - palette.position[p];
    var colorFactor = 
      1.0 / (1 + palette.sharpness[p] * dist * dist);
    red += colorFactor * palette.red[p];
    green += colorFactor * palette.green[p];
    blue += colorFactor * palette.blue[p];
  }
  red = Math.floor(red);
  green = Math.floor(green);
  blue = Math.floor(blue);
  return [red, green, blue];
}