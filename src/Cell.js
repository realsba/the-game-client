import * as PIXI from 'pixi.js';
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
  _current = 0;
  _finish = 0;
  _step = 0;
  _time = 0;

  init(current, finish, time) {
    this._current = current;
    this._finish = finish;
    this._step = (finish - current) / time;
    this._time = time;
  };

  isActive() {
    return this._time > 0;
  };

  animate(dt) {
    if (this._time > 0) {
      this._time -= dt;
      if (this._time > 0) {
        this._current += this._step * dt;
      } else {
        this._time = 0;
        this._current = this._finish;
      }
      return this._current;
    }
    return false;
  };
}

class PositionSmoother {
  _step = null;
  _time = 0;

  constructor(current) {
    this._current = current;
  }

  init(x, y, time) {
    const step = new Vec2D((x - this._current._x) / time, (y - this._current._y) / time);
    if (step.squareLength() < 5 * 5) {
      return;
    }
    this._step = step;
    this._time = time;
  };

  isActive() {
    return this._time > 0;
  };

  smooth(dt) {
    if (this._time > 0) {
      this._time -= dt;
      if (this._time > 0) {
        this._current.assignmentSum(this._step.scalarProduct(dt));
      } else {
        this._current.assignmentSum(this._step.scalarProduct((this._time + dt) * dt));
        this._time = 0;
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

export class Cell extends PIXI.Graphics {
  _force = new Vec2D();
  _radiusAnimator = new Animator();
  _alphaAnimator = new Animator();

  constructor(room, def, scale) {
    super();

    room.addChild(this);

    this._room = room;
    this._id = def.id;
    this._position = new Vec2D(def.x, def.y);
    this._velocity = new Vec2D(def.vx, def.vy);
    this._color = def.color;
    this._mass = def.mass;
    this._radius = def.radius;
    this._playerId = def.playerId;
    this._viewRadius = this._radius;
    this._scale = scale;

    this._positionSmoother = new PositionSmoother(this._position);

    const position = this._position.scalarProduct(this._scale);
    this.position.x = position._x;
    this.position.y = position._y;

    if (def.isNew()) {
      this.alpha = 0;
      this._alphaAnimator.init(0, 1, 2);
    }

    this.interactive = true;
    this.on('mousedown', function (mouse) {
      const event = mouse.data.originalEvent;
      if (event.ctrlKey && event.altKey) {
        console.log(mouse.target.object.toString());
      }
      mouse.stopPropagation();
    });
  }

  toString = function () {
    return `${this._className}: id=${this._id} mass=${this._mass} radius=${this._radius}`
      `(${this._position._x}:${this._position._y})`;
  };

  modify(def) {
    this._velocity._x = def.vx;
    this._velocity._y = def.vy;
    this.radius = def.radius;
    this.mass = def.mass;
    this._positionSmoother.init(def.x, def.y, 0.25);
  };

  draw() {
    this.clear();
    this.lineStyle(4, this._color, 1);
    this.beginFill(this._color, 0.85);
    this.drawCircle(0, 0, this._viewRadius * this._scale);
    this.endFill();
  };

  // TODO: use setter
  setScale(scale) {
    this._scale = scale;
    this.position.x = this._position._x * this._scale;
    this.position.y = this._position._y * this._scale;
    this.draw();
  };

  set radius(value) {
    if (this._radius !== value) {
      this._radius = value;
      this._radiusAnimator.init(this._viewRadius, value, 1);
    }
  };

  set mass(value) {
    this._mass = value;
  };

  isSimulated() {
    return !this._velocity.isZero() || this._positionSmoother.isActive();
  };

  isAnimated() {
    return this._radiusAnimator.isActive() || this._alphaAnimator.isActive();
  };

  simulateInternal(dt, resistanceRatio) {
    const scalar = this._radius * resistanceRatio;
    this._force.assignmentDifference(this._velocity.direction().scalarProduct(scalar));
    const acceleration = this._force.scalarDivision(this._mass);
    this._velocity.assignmentSum(acceleration.scalarProduct(dt));
    this._position.assignmentSum(this._velocity.scalarProduct(dt));
    this._positionSmoother.smooth(dt);
    this.position.x = this._position._x * this._scale;
    this.position.y = this._position._y * this._scale;
    this._force.zero();
  };

  simulate(dt) {
    this.simulateInternal(dt, this._room._resistanceRatio); // TODO: use getter
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
  constructor(room, def, scale) {
    super(room, def, scale);
  }

  draw() {
    this.clear();
    this.beginFill(this._color, 1);
    this.drawCircle(0, 0, this._viewRadius * this._scale);
    this.endFill();
  };

  simulate(dt) {
    this.simulateInternal(dt, this._room._foodResistanceRatio);
  };
}

export class Mass extends Cell {
  constructor(room, def, scale) {
    super(room, def, scale)

    if (def.isNew()) {
      this.alpha = 0.25;
      this._alphaAnimator.init(this.alpha, 1, 2);
    }
  }
}

export class Avatar extends Cell {
  _textSize = 24;
  _textMassSize = 8;

  constructor(room, def, scale) {
    super(room, def, scale);

    this._name = def.name;
    this._viewMass = this._mass;
    this._maxSpeed = 0;

    this._massAnimator = new Animator();

    let fontSize = Math.max((this._textSize * scale) >> 0, 8);
    this._text = new PIXI.Text(
      this._name,
      {
        'fontFamily': 'Arial',
        'fontSize': fontSize + 'pt',
        'fontWeight': 'bold',
        'fill': 0xFFFFFF,
        'stroke': blur(def.color, 80),
        'strokeThickness': 2,
        'align': 'center'
      }
    );
    fontSize = Math.max((this._textMassSize * scale) >> 0, 8);
    this._textMass = new PIXI.Text(
      this._viewMass,
      {
        'fontFamily': 'Arial',
        'fontSize': fontSize + 'pt',
        'fontWeight': 'bold',
        'fill': 0xCCCCCC,
        'stroke': blur(def.color, 80),
        'strokeThickness': 2,
        'align': 'center'
      }
    );
    this.addChild(this._text);
    this.addChild(this._textMass);
    this.updateTextPosition();

    this.on('mousedown', function (mouse) {
      const event = mouse.data.originalEvent;
      if (event.ctrlKey && !event.altKey) {
        const avatar = mouse.target.object;
        // TODO: implement
        //const binary = new jBinary(5);
        //binary.writeUInt8(10);
        //binary.writeUInt32(avatar._playerId);
        //avatar._room._socket.send(binary.view.buffer);
      }
      mouse.stopPropagation();
    });
  }

  setScale(scale) {
    super.setScale(scale);
    const textStyle = this._text.style;
    textStyle['font'] = 'bold ' + (this._textSize * scale) + 'px Arial';
    this._text['style'] = textStyle;
    const textMassStyle = this._textMass.style;
    textMassStyle['font'] = 'bold ' + (this._textMassSize * scale) + 'px Arial';
    this._textMass['style'] = textMassStyle;
    this.updateTextPosition();
  };

  updateTextPosition() {
    this._text.position.x = -this._text.width / 2;
    this._text.position.y = -this._text.height / 2;
    this._textMass.position.x = -this._textMass.width / 2;
    this._textMass.position.y = this._text.position.y + this._text.height - 0.25 * this._textMass.height;
  };

  set mass(mass) {
    if (mass !== this._mass) {
      this._mass = mass;
      this._massAnimator.init(this._viewMass, mass, Math.abs(mass - this._viewMass) <= 5 ? 0.05 : 1);
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
      this._textMass.text = ~~res;
      this.updateTextPosition();
    }
  };
}

export class Virus extends Cell {
  constructor(room, def, scale) {
    super(room, def, scale);
    if (def.isNew()) {
      this._viewRadius = 0;
      this._radiusAnimator.init(0, this._radius, 1);
    }
  }

  draw() {
    let path = [];
    let n = 16;
    let alpha = 0;
    let angle = Math.PI / n;
    let r1 = this._viewRadius * this._scale;
    let r2 = 1.075 * this._viewRadius * this._scale;
    for (let i = 0; i <= n; ++i) {
      path.push(r1 * Math.sin(alpha), r1 * Math.cos(alpha));
      alpha += angle;
      path.push(r2 * Math.sin(alpha), r2 * Math.cos(alpha));
      alpha += angle;
    }
    this.clear();
    this.lineStyle(4, this._color, 1);
    this.beginFill(this._color, 0.85);
    this.drawPolygon(path);
    this.endFill();
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
