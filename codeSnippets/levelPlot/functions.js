/**
 * Computes total variation of a discrete function on a cycle,
 * that is, computes sum of distances between all entries `values[i]` and
 * `values[i+1]`, plus the distance between first and last entry.
 *
 * Expects an array of double values of input.
 * Returns a double. 
 */
function cyclicTotalVariation(values) {
  var res = 0.0;
  for (var i = 1; i < values.length; i++) {
    res += Math.abs(values[i-1] - values[i]);
  }
  return res + Math.abs(values[0] - values[values.length - 1]);
}

/**
 * Rectangle with sides parallel to the x and y axis.
 */
function Rect(left, right, bottom, top) {
  this.top = top;
  this.bottom = bottom;
  this.left = left;
  this.right = right;
  this.width = right - left;
  this.height = top - bottom;
  this.area = this.width * this.height;
}

/** 
 * Rectangular subset of the plotted area,
 * with screen coordinates, world coordinates, and
 * function values evaluated on the vertices.
 */
function FunctionPatch(
  worldRect,
  screnRect, // [sic] It's intentionally 'scren', so it has same length...
  values     // tr, tl, bl, br
) {
  this.worldRect = worldRect;
  this.screnRect = screnRect;
  this.values = values;

  /** 
   * Splits this rectangle into two smaller 
   * rectangles. The values on the four new vertices are 
   * initialized using the function `f`. The
   * function `f` is expected to take two doubles and return a 
   * single double.
   */
  this.subdivide = function(f) {
    if (screnRect.width > screnRect.height) {
      // split horizontally into [ A | B ]
      var dx = worldRect.width / (screnRect.width - 1);

      var aScrenWidth = Math.floor(screnRect.width / 2);
      var bScrenWidth = screnRect.width - aScrenWidth;
      var aScrenRight = screnRect.left + aScrenWidth;
      var bScrenLeft = screnRect.right - bScrenWidth;

      var aWorldWidth = (aScrenWidth - 1) * dx;
      var bWorldWidth = (bScrenWidth - 1) * dx;
      var aWorldRight = worldRect.left + aWorldWidth;
      var bWorldLeft = worldRect.right - bWorldWidth;

      var aTopRight = f(aWorldRight, worldRect.top);
      var aBottomRight = f(aWorldRight, worldRect.bottom);

      var bTopLeft = f(bWorldLeft, worldRect.top);
      var bBottomLeft = f(bWorldLeft, worldRect.bottom);

      var a = new FunctionPatch(
        new Rect(worldRect.left, aWorldRight, worldRect.bottom, worldRect.top),
        new Rect(screnRect.left, aScrenRight, screnRect.bottom, screnRect.top),
        [aTopRight, values[1], values[2], aBottomRight]
      );
      
      var b = new FunctionPatch(
        new Rect(bWorldLeft, worldRect.right, worldRect.bottom, worldRect.top),
        new Rect(bScrenLeft, screnRect.right, screnRect.bottom, screnRect.top),
        [values[0], bTopLeft, bBottomLeft, values[3]]
      );

      return [a, b];
    } else {
      // split vertically, A on bottom, B on top
      var dy = worldRect.height / (screnRect.height - 1);

      var aScrenHeight = Math.floor(screnRect.height / 2);
      var bScrenHeight = screnRect.height - aScrenHeight;
      var aScrenTop = screnRect.bottom + aScrenHeight;
      var bScrenBottom = screnRect.top - bScrenHeight;

      var aWorldHeight = (aScrenHeight - 1) * dy;
      var bWorldHeight = (bScrenHeight - 1) * dy;
      var aWorldTop = worldRect.bottom + aWorldHeight;
      var bWorldBottom = worldRect.top - bWorldHeight;

      var aTopRight = f(worldRect.right, aWorldTop);
      var aTopLeft = f(worldRect.left, aWorldTop);

      var bBottomLeft = f(worldRect.left, bWorldBottom);
      var bBottomRight = f(worldRect.right, bWorldBottom);

      var a = new FunctionPatch(
        new Rect(worldRect.left, worldRect.right, worldRect.bottom, aWorldTop),
        new Rect(screnRect.left, screnRect.right, screnRect.bottom, aScrenTop),
        [aTopRight, aTopLeft, values[2], values[3]]
      );
      
      var b = new FunctionPatch(
        new Rect(worldRect.left, worldRect.right, bWorldBottom, worldRect.top),
        new Rect(screnRect.left, screnRect.right, bScrenBottom, screnRect.top),
        [values[0], values[1], bBottomLeft, bBottomRight]
      );

      return [a, b];
    }
  }
}