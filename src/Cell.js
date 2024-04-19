import { Container, Graphics, Text } from 'pixi.js';
import Vec2D from './Vec2D.js';

function blur(color, x) {
  let r = (color >> 16) & 0xFF;
  let g = (color >> 8) & 0xFF;
  let b = color & 0xFF;
  r -= x;
  g -= x;
  b -= x;
  if (r < 0) {
    r = 0;
  }
  if (g < 0) {
    g = 0;
  }
  if (b < 0) {
    b = 0;
  }
  return (r << 16) + (g << 8) + b;
}

class Animator {
  #current = 0;
  #finish = 0;
  #step = 0;
  #time = 0;

  init(current, finish, time) {
    this.#current = current;
    this.#finish = finish;
    this.#step = (finish - current) / time;
    this.#time = time;
  };

  isActive() {
    return this.#time > 0;
  };

  animate(dt) {
    if (this.#time > 0) {
      this.#time -= dt;
      if (this.#time > 0) {
        this.#current += this.#step * dt;
      } else {
        this.#time = 0;
        this.#current = this.#finish;
      }
      return this.#current;
    }
    return false;
  };
}

class PositionSmoother {
  #step = null;
  #time = 0;
  #current;

  constructor(current) {
    this.#current = current;
  }

  init(x, y, time) {
    const step = new Vec2D((x - this.#current.x) / time, (y - this.#current.y) / time);
    if (step.squareLength() < 5 * 5) {
      return;
    }
    this.#step = step;
    this.#time = time;
  };

  isActive() {
    return this.#time > 0;
  };

  smooth(dt) {
    if (this.#time > 0) {
      this.#time -= dt;
      if (this.#time > 0) {
        this.#current.assignmentSum(this.#step.scalarProduct(dt));
      } else {
        this.#current.assignmentSum(this.#step.scalarProduct((this.#time + dt) * dt)); // TODO: revise
        this.#time = 0;
      }
      return true;
    }
    return false;
  };
}

export class CellDef {
  static TYPE_AVATAR = 1;
  static TYPE_FOOD = 2;
  static TYPE_MASS = 3;
  static TYPE_VIRUS = 4;
  static TYPE_PHAGE = 5;
  static TYPE_MOTHER = 6;
  static FLAG_NEW = 64;
  static FLAG_MOVING = 128;

  static MASK_TYPE = 15;

  type = null;
  id = null;
  x = null;
  y = null;
  mass = null;
  radius = null;
  color = null;
  vx = null;
  vy = null;
  playerId = null;
  name = null;

  isAvatar() {
    return (this.type & CellDef.MASK_TYPE) === CellDef.TYPE_AVATAR;
  };

  isFood() {
    return (this.type & CellDef.MASK_TYPE) === CellDef.TYPE_FOOD;
  };

  isMass() {
    return (this.type & CellDef.MASK_TYPE) === CellDef.TYPE_MASS;
  };

  isVirus() {
    const type = this.type & CellDef.MASK_TYPE;
    return type === CellDef.TYPE_VIRUS || type === CellDef.TYPE_PHAGE;
  };

  isMother() {
    return (this.type & CellDef.MASK_TYPE) === CellDef.TYPE_MOTHER;
  };

  isNew() {
    return (this.type & CellDef.FLAG_NEW) !== 0;
  };

  isMoving() {
    return (this.type & CellDef.FLAG_MOVING) !== 0;
  };
}

export class Cell extends Container {
  #room;
  _force = new Vec2D();
  _radiusAnimator = new Animator();
  _alphaAnimator = new Animator();
  #position = new Vec2D();
  #positionSmoother = new PositionSmoother(this.#position);
  _view = new Graphics();

  static #resistanceRatio = 0;

  static set resistanceRatio(value) {
    Cell.#resistanceRatio = value;
  }

  constructor(room, def) {
    super();

    this.addChild(this._view);
    room.addChild(this);

    this.#room = room;
    this._id = def.id;
    this._velocity = new Vec2D(def.vx, def.vy);
    this._color = def.color;
    this._mass = def.mass;
    this._radius = def.radius;
    this._playerId = def.playerId;
    this._viewRadius = this._radius;
    this.#position.set(def.x, def.y);

    this.position.set(this.#position.x, this.#position.y);

    if (def.isNew()) {
      this.alpha = 0;
      this._alphaAnimator.init(0, 1, 2);
    }

    this.eventMode = 'static';
    this.onmousedown = event => {
      if (event.ctrlKey) {
        console.log(event.target.toString());
      }
      if (event.altKey) {
        console.log(event.target);
      }
      event.stopPropagation();
    }
  }

  get resistanceRatio() {
    return Cell.#resistanceRatio;
  }

  get room() {
    return this.#room;
  }

  get id() {
    return this._id;
  }

  get mass() {
    return this._mass;
  }

  set mass(value) {
    this._mass = value;
  };

  get playerId() {
    return this._playerId;
  }

  toString() {
    return `${this.constructor.name}: id=${this._id} mass=${this._mass} radius=${this._radius}` +
      ` (${this._position.x >> 0}:${this._position.y >> 0})`;
  };

  modify(def) {
    this._velocity.set(def.vx, def.vy);
    this.radius = def.radius;
    this.mass = def.mass;
    this.#positionSmoother.init(def.x, def.y, 0.25);
  };

  draw() {
    this._view.clear();
    this._view.circle(0, 0, this._viewRadius);
    this._view.fill({color: this._color, alpha: 0.85});
    this._view.stroke({color: this._color, alpha: 1, width: 4});
  };

  set radius(value) {
    if (this._radius !== value) {
      this._radius = value;
      this._radiusAnimator.init(this._viewRadius, value, 1);
    }
  };

  isSimulated() {
    return !this._velocity.isZero() || this.#positionSmoother.isActive();
  };

  isAnimated() {
    return this._radiusAnimator.isActive() || this._alphaAnimator.isActive();
  };

  simulate(dt) {
    const scalar = this._radius * this.resistanceRatio;
    this._force.assignmentDifference(this._velocity.direction().scalarProduct(scalar));
    const acceleration = this._force.scalarDivision(this._mass);
    this._velocity.assignmentSum(acceleration.scalarProduct(dt));
    this.#position.assignmentSum(this._velocity.scalarProduct(dt));
    this.#positionSmoother.smooth(dt);
    this.position.set(this.#position.x, this.#position.y);
    this._force.reset();
  };

  animate(dt) {
    let redraw = false;
    let res = this._radiusAnimator.animate(dt);
    if (res !== false) {
      this._viewRadius = res;
      redraw = true;
    }
    res = this._alphaAnimator.animate(dt);
    if (res !== false) {
      this.alpha = res;
      redraw = true;
    }
    if (redraw) {
      this.draw();
    }
  };
}

export class Food extends Cell {
  static #resistanceRatio = 0;

  static set resistanceRatio(value) {
    Food.#resistanceRatio = value;
  }

  constructor(room, def) {
    super(room, def);
  }

  get resistanceRatio() {
    return Food.#resistanceRatio;
  }

  draw() {
    this._view.clear();
    this._view.circle(0, 0, this._viewRadius);
    this._view.fill({color: this._color});
  };
}

export class Mass extends Cell {
  constructor(room, def) {
    super(room, def)

    if (def.isNew()) {
      this.alpha = 0.25;
      this._alphaAnimator.init(this.alpha, 1, 2);
    }
  }
}

export class Avatar extends Cell {
  #text;
  #textMass;

  constructor(room, def) {
    super(room, def);

    this._name = def.name;
    this._viewMass = this._mass;
    this._maxSpeed = 0;

    this._massAnimator = new Animator();

    this.#text = new Text({
      text: this._name,
      style: {
        fontFamily: 'Arial',
        fontSize: '30pt',
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: blur(def.color, 80),
        align: 'center'
      }
    });
    this.#textMass = new Text({
      text: this._viewMass,
      style: {
        fontFamily: 'Arial',
        fontSize: '14pt',
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: blur(def.color, 80),
        align: 'center'
      }
    });
    this.addChild(this.#text);
    this.addChild(this.#textMass);
    this.updateTextPosition();
  }

  updateTextPosition() {
    this.#text.position.x = -this.#text.width / 2;
    this.#text.position.y = -this.#text.height / 2;
    this.#textMass.position.x = -this.#textMass.width / 2;
    this.#textMass.position.y = this.#text.position.y + this.#text.height - 0.25 * this.#textMass.height;
  };

  get mass() {
    return super.mass;
  }

  set mass(value) {
    if (value !== this._mass) {
      super.mass = value;
      this._massAnimator.init(this._viewMass, value, Math.abs(value - this._viewMass) <= 5 ? 0.05 : 1);
    }
  };

  isSimulated() {
    return true;
  };

  isAnimated() {
    return super.isAnimated() || this._massAnimator.isActive();
  };

  animate(dt) {
    super.animate(dt);
    const res = this._massAnimator.animate(dt);
    if (res !== false) {
      this._viewMass = res;
      this.#textMass.text = ~~res;
      this.updateTextPosition();
    }
  };
}

export class Virus extends Cell {
  constructor(room, def) {
    super(room, def);
    if (def.isNew()) {
      this._viewRadius = 0;
      this._radiusAnimator.init(0, this._radius, 1);
    }
  }

  draw() {
    let path = [];
    const n = 16;
    let alpha = 0;
    const angle = Math.PI / n;
    const r1 = this._viewRadius;
    const r2 = 1.075 * this._viewRadius;
    for (let i = 0; i <= n; ++i) {
      path.push(r1 * Math.sin(alpha), r1 * Math.cos(alpha));
      alpha += angle;
      path.push(r2 * Math.sin(alpha), r2 * Math.cos(alpha));
      alpha += angle;
    }
    this._view.clear();
    this._view.poly(path);
    this._view.fill({color: this._color, alpha: 0.85});
    this._view.stroke({color: this._color, alpha: 1, width: 4});
  };

  isAnimated() {
    return true;
  };

  animate(dt) {
    super.animate(dt);
    this.rotation += Math.PI / 720;
  };
}

export class Mother extends Virus {
  constructor(...args) {
    super(...args);
  }

  animate(dt) {
    super.animate(dt)
    this.rotation -= Math.PI / 720;
  };
}
