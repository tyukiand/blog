/*
var x = 1;
console.log(x);
var x = 2;
console.log(x);
var x = "is now a string";
console.log(x);
*/

/*
var x = 42;
console.log(x);
console.log(y);
{
  var x = -1;
  var y = 314159;
  console.log(x);
  console.log(y);
}
console.log(x);
console.log(y);
*/

/*
var x = 42;
function foo() {
  var x = -1;
  var y = 314159;
  console.log(x);
  console.log(y);
}
foo();
console.log(x);
console.log(y);
*/

/*
var x = 42;
var z = 1000;
(function () {
  var x = -1;
  var y = 314159;
  z = 1000000;
  console.log(x);
  console.log(y);
})();
console.log(x);
console.log(z);
*/

/*
var x = 42;
var y = 10;
var r = (function () {
  var xSq = x * x;
  var ySq = y * y;
  return Math.sqrt(xSq + ySq);
})();
console.log(r);
*/


/*
var x = 42;
function x(y) {
  return y * y;
}

console.log(x);
console.log(x(x));
*/

/* (nothing unpredictable here)
var x = 42;
function foo() {
  function x() {
    console.log("blah");
  }
  x();
}
console.log(x);

function y() {
  console.log("blah");
}
function foo() {
  var y = 42;
  console.log(y);
}
y();
*/

/*
function x() {
  console.log("1");
}
{
  function x() {
    console.log("2");
  }
  x();
}
x();
*/

/*
var i = 42;
for (var i = 0; i < 3; i++) {
  console.log(i);
}
console.log(i);
*/

/*
var fs = [];
for (var i = 0; i < 3; i++) {
  fs.push( function() {
    console.log("I am function " + i);
  });
}
for (var j = 0; j < 3; j++) {
  fs[j]();
}
*/

/*
var i = 42;
var fs = [];
(function () {
  for (var i = 0; i < 3; i++) { (function(i) {
    fs.push(function() {
      console.log("I am function " + i);
    });
  })(i);}
})();
(function () {
  for (var i = 0; i < 3; i++) {
    fs[i]();
  }
})();
console.log(i);
*/

var i = 42;
var fs = [];

for (var j = 0; j < 3; j++) { (function(i) {
  fs.push(function() {
    console.log("I am function " + i);
  });
})(j);}


for (var k = 0; k < 3; k++) {
  fs[k]();
}

console.log(i);
