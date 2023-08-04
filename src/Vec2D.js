export default class Vec2D {
  #x = 0;
  #y = 0;

  constructor(x, y) {
    this.#x = x || 0;
    this.#y = y || 0;
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  set(x, y) {
    this.#x = x;
    this.#y = y;
  }

  direction () {
    let direction = new Vec2D();
    let l = this.length();
    if (l > 0) {
      direction.#x = this.#x / l;
      direction.#y = this.#y / l;
    }
    return direction;
  };

  length() {
    return Math.sqrt(this.squareLength());
  };

  squareLength() {
    return this.#x * this.#x + this.#y * this.#y;
  };

  normalize() {
    let l = this.length();
    if (l > 0) {
      this.#x /= l;
      this.#y /= l;
    }
  };

  reset() {
    this.#x = 0;
    this.#y = 0;
  };

  isZero() {
    return this.#x === 0 && this.#y === 0;
  };

  assign(other) {
    this.#x = other.x;
    this.#y = other.y;
  };

  scalarProduct(k) {
    return new Vec2D(this.#x * k, this.#y * k);
  };

  scalarDivision(k) {
    return new Vec2D(this.#x / k, this.#y / k);
  };

  assignmentSum(other) {
    this.#x += other.x;
    this.#y += other.y;
  };

  assignmentDifference(other) {
    this.#x -= other.x;
    this.#y -= other.y;
  };
}

export function scalarProductOfVectors(lhs, rhs) {
  return lhs.x * rhs.x + lhs.y * rhs.y;
}
