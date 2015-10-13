/**
 * Simple prototype object for complex numbers.
 */
function C(real, imaginary) {
  this.re = real;
  this.im = imaginary;
  this.abs = function() {
    return Math.hypot(this.re, this.im);
  }
  this.sqAbs = function() {
    return this.re * this.re + this.im * this.im;
  }
  this.square = function() {
    return new C(
      this.re * this.re - this.im * this.im, 
      2 * this.re * this.im
    );
  }
  this.square_inplace = function() {
    var newIm = 2 * this.re * this.im;
    this.re = this.re * this.re - this.im * this.im;
    this.im = newIm;
  }
  this.add = function(other) {
    return new C(this.re + other.re, this.im + other.im);
  }
  this.add_inplace = function(other) {
    this.re += other.re;
    this.im += other.im;
  }
  this.sub = function(other) {
    return new C(this.re - other.re, this.im - other.im);
  }
  this.sub_inplace = function(other) {
    this.re -= other.re;
    this.im -= other.im;
  }
  this.mul = function(other) {
    return new C(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }
  this.sqrt = function() {
    var h = Math.hypot(this.re, this.im);
    return new C(
      Math.sqrt((h + this.re) / 2),
      Math.sign(this.im) * Math.sqrt((h - this.re) / 2)
    );
  }
  this.sqrt_inplace = function() {
    var h = Math.hypot(this.re, this.im);
    var newRe = Math.sqrt((h + this.re) / 2);
    this.im = Math.sign(this.im) * Math.sqrt((h - this.re) / 2);
    this.re = newRe;
  }
  this.negative = function() {
    return new C(-this.re, -this.im);
  }
  this.negate_inplace = function() {
    this.re = -this.re;
    this.im = -this.im;
  }
}