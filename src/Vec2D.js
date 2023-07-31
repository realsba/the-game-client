export default class Vec2D {
  _x = 0;
  _y = 0;

  constructor(x, y) {
    this._x = x || 0;
    this._y = y || 0;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  direction () {
    let direction = new Vec2D();
    let l = this.length();
    if (l > 0) {
      direction._x = this._x / l;
      direction._y = this._y / l;
    }
    return direction;
  };

  length() {
    return Math.sqrt(this.squareLength());
  };

  squareLength() {
    return this._x * this._x + this._y * this._y;
  };

  normalize() {
    let l = this.length();
    if (l > 0) {
      this._x /= l;
      this._y /= l;
    }
  };

  reset() {
    this._x = 0;
    this._y = 0;
  };

  isZero() {
    return this._x === 0 && this._y === 0;
  };

  assign(other) {
    this._x = other._x;
    this._y = other._y;
  };

  scalarProduct(k) {
    return new Vec2D(this._x * k, this._y * k);
  };

  scalarDivision(k) {
    return new Vec2D(this._x / k, this._y / k);
  };

  assignmentSum(other) {
    this._x += other._x;
    this._y += other._y;
  };

  assignmentDifference(other) {
    this._x -= other._x;
    this._y -= other._y;
  };
}

export function scalarProductOfVectors(lhs, rhs) {
  return lhs.x * rhs.x + lhs.y * rhs.y;
}
