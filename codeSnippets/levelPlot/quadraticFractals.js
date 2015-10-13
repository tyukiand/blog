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