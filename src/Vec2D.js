/**
 * @constructor
 */
function Vec2D(x, y) {
  this._x = x || 0;
  this._y = y || 0;
}

/**
 * @return {Vec2D}
 */
Vec2D.prototype.direction = function () {
  var direction = new Vec2D();
  var l = this.length();
  if (l > 0) {
    direction._x = this._x / l;
    direction._y = this._y / l;
  }
  return direction;
};

Vec2D.prototype.length = function () {
  return Math.sqrt(this.squareLength());
};

Vec2D.prototype.squareLength = function () {
  return this._x * this._x + this._y * this._y;
};

Vec2D.prototype.normalize = function () {
  var l = this.length();
  if (l > 0) {
    this._x /= l;
    this._y /= l;
  }
};

Vec2D.prototype.zero = function () {
  this._x = 0;
  this._y = 0;
};

/**
 * @return {boolean}
 */
Vec2D.prototype.isZero = function () {
  return this._x == 0 && this._y == 0;
};

/**
 * @param {Vec2D} other
 */
Vec2D.prototype.assign = function (other) {
  this._x = other._x;
  this._y = other._y;
};

/**
 * @return {Vec2D}
 */
Vec2D.prototype.scalarProduct = function (k) {
  return new Vec2D(this._x * k, this._y * k);
};

/**
 * @return {Vec2D}
 */
Vec2D.prototype.scalarDivision = function (k) {
  return new Vec2D(this._x / k, this._y / k);
};

/**
 * @param {Vec2D} other
 */
Vec2D.prototype.assignmentSum = function (other) {
  this._x += other._x;
  this._y += other._y;
};

/**
 * @param {Vec2D} other
 */
Vec2D.prototype.assignmentDifference = function (other) {
  this._x -= other._x;
  this._y -= other._y;
};

/**
 * @param {Vec2D} lhs
 * @param {Vec2D} rhs
 */
function scalarProductOfVectors(lhs, rhs) {
  return lhs._x * rhs._x + lhs._y * rhs._y;
}