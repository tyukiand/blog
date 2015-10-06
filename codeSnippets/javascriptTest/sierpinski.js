function drawSierpinski() {
  var canvas = document.getElementById("sierpinski");
  var w = canvas.width;
  var canvasHeight = canvas.height;
  var h = Math.sqrt(w * w - (w / 2) * (w / 2));
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0,w,canvasHeight);
  ctx.fillStyle = "rgba(0,0,0,1)";
  function mid(a, b) {
    return {x:(a.x + b.x) / 2, y: (a.y + b.y) / 2};
  }
  function rec(a,b,c) {
    if (c.x - a.x < 2) {
      ctx.fillRect(a.x, a.y, 1, 1);
    } else {
      var ab = mid(a, b);
      var ac = mid(a, c);
      var bc = mid(b, c);
      rec(a, ab, ac);
      rec(ab, b, bc);
      rec(ac, bc, c);
    }
  }
  function p(x, y) {
    return {x: x, y: y};
  }
  rec(p(0, h), p(w / 2, 0), p(w, h));
}