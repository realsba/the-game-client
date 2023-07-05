/* global PIXI */

function blur(color, x) {
  var r = (color >> 16) & 0xFF;
  var g = (color >> 8) & 0xFF;
  var b = color & 0xFF;
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

/**
 * @constructor
 */
function Animator() {
  this._current = 0;
  this._finish = 0;
  this._step = 0;
  this._time = 0;
};

Animator.prototype.init = function (current, finish, time) {
  this._current = current;
  this._finish = finish;
  this._step = (finish - current) / time;
  this._time = time;
};

Animator.prototype.isActive = function () {
  return this._time > 0;
};

Animator.prototype.animate = function (dt) {
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

/**
 * @constructor
 * @param {Vec2D} current
 */
function PositionSmoother(current) {
  this._current = current;
  this._step = null;
  this._time = 0;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} time
 */
PositionSmoother.prototype.init = function (x, y, time) {
  var step = new Vec2D((x - this._current._x) / time, (y - this._current._y) / time);
  if (step.squareLength() < 5 * 5) {
    return;
  }
  this._step = step;
  this._time = time;
};

PositionSmoother.prototype.isActive = function () {
  return this._time > 0;
};

PositionSmoother.prototype.smooth = function (dt) {
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

/**
 * @constructor
 */
function CellDef() {
  this._type = null;
  this._id = null;
  this._x = null;
  this._y = null;
  this._mass = null;
  this._radius = null;
  this._color = null;
  this._vx = null;
  this._vy = null;
  this._playerId = null;
  this._name = null;
}

CellDef.prototype.isAvatar = function () {
  return (this._type & 15) == 1;
};

CellDef.prototype.isFood = function () {
  return (this._type & 15) == 2;
};

CellDef.prototype.isMass = function () {
  return (this._type & 15) == 3;
};

CellDef.prototype.isVirus = function () {
  var type = this._type & 15;
  return type == 4 || type == 5;
};

CellDef.prototype.isMother = function () {
  return (this._type & 15) == 6;
};

CellDef.prototype.isNew = function () {
  return (this._type & 64) != 0;
};

CellDef.prototype.isMoving = function () {
  return (this._type & 128) != 0;
};

/**
 * @constructor
 * @param {Room} room
 * @param {CellDef} def
 * @param {number} scale
 */
function Cell(room, def, scale) {
  this._room = room;
  this._id = def._id;
  this._position = new Vec2D(def._x, def._y);
  this._velocity = new Vec2D(def._vx, def._vy);
  this._force = new Vec2D();
  this._color = def._color;
  this._mass = def._mass;
  this._radius = def._radius;
  this._playerId = def._playerId;

  this._viewRadius = this._radius;
  this._scale = scale;

  this._positionSmoother = new PositionSmoother(this._position);
  this._radiusAnimator = new Animator();
  this._alphaAnimator = new Animator();

  this._graphics = new PIXI.Graphics();
  this._graphics.object = this;
  var position = this._position.scalarProduct(this._scale);
  this._graphics.position.x = position._x;
  this._graphics.position.y = position._y;

  if (def.isNew()) {
    this._graphics.alpha = 0;
    this._alphaAnimator.init(0, 1, 2);
  }

  this._graphics.interactive = true;
  this._graphics.on('mousedown', function (mouse) {
    var event = mouse.data.originalEvent;
    if (event.ctrlKey && event.altKey) {
      console.log(mouse.target.object.toString());
    }
    mouse.stopPropagation();
  });
}

Cell.prototype._className = 'Cell';

Cell.prototype.toString = function () {
  return sprintf('%s: id=%d mass=%d radius=%d (%d;%d)', this._className, this._id, this._mass, this._radius, this._position._x, this._position._y);
};

/**
 * @param {CellDef} def
 */
Cell.prototype.modify = function (def) {
  this._velocity._x = def._vx;
  this._velocity._y = def._vy;
  this.setRadius(def._radius);
  this.setMass(def._mass);
  this._positionSmoother.init(def._x, def._y, 0.25);
//  this._position._x = def._x;
//  this._position._y = def._y;
//  if (def._protection) {
//    this._protection = def._protection;
//  }
};

Cell.prototype.draw = function () {
  this._graphics.clear();
  this._graphics.lineStyle(4, this._color, 1);
  this._graphics.beginFill(this._color, 0.85);
  this._graphics.drawCircle(0, 0, this._viewRadius * this._scale);
  this._graphics.endFill();
};

Cell.prototype.setScale = function (scale) {
  this._scale = scale;
  this._graphics.position.x = this._position._x * this._scale;
  this._graphics.position.y = this._position._y * this._scale;
  this.draw();
};

Cell.prototype.setRadius = function (radius) {
  if (radius != this._radius) {
    this._radius = radius;
    this._radiusAnimator.init(this._viewRadius, radius, 1);
  }
};

Cell.prototype.setMass = function (mass) {
  this._mass = mass;
};

Cell.prototype.isSimulated = function () {
  return !this._velocity.isZero() || this._positionSmoother.isActive();
};

Cell.prototype.isAnimated = function () {
  return this._radiusAnimator.isActive() || this._alphaAnimator.isActive();
};

Cell.prototype.simulateInternal = function (dt, resistanceRatio) {
  var scalar = this._radius * resistanceRatio;
  this._force.assignmentDifference(this._velocity.direction().scalarProduct(scalar));
  var acceleration = this._force.scalarDivision(this._mass);
  this._velocity.assignmentSum(acceleration.scalarProduct(dt));
  this._position.assignmentSum(this._velocity.scalarProduct(dt));
  this._positionSmoother.smooth(dt);
  this._graphics.position.x = this._position._x * this._scale;
  this._graphics.position.y = this._position._y * this._scale;
  this._force.zero();
};


Cell.prototype.simulate = function (dt) {
  this.simulateInternal(dt, this._room._resistanceRatio);
};

Cell.prototype.animate = function (dt) {
  var redraw = false;
  var res = this._radiusAnimator.animate(dt);
  if (res !== false) {
    this._viewRadius = res;
    redraw = true;
  }
  res = this._alphaAnimator.animate(dt);
  if (res !== false) {
    this._graphics.alpha = res;
    redraw = true;
  }
  if (redraw) {
    this.draw();
  }
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 */
function Food() {
  Cell.apply(this, arguments);
}

Food.prototype = Object.create(Cell.prototype);

Food.prototype._className = 'Food';

Food.prototype.draw = function () {
  this._graphics.clear();
  this._graphics.beginFill(this._color, 1);
  this._graphics.drawCircle(0, 0, this._viewRadius * this._scale);
  this._graphics.endFill();
};

Food.prototype.simulate = function (dt) {
  this.simulateInternal(dt, this._room._foodResistanceRatio);
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @param {Room} room
 * @param {CellDef} def
 */
function Mass(room, def) {
  Cell.apply(this, arguments);
  if (def.isNew()) {
    this._graphics.alpha = 0.25;
    this._alphaAnimator.init(this._graphics.alpha, 1, 2);
  }
}

Mass.prototype = Object.create(Cell.prototype);

Mass.prototype._className = 'Mass';

//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @param {Room} room
 * @param {CellDef} def
 * @param {number} scale
 */
function Avatar(room, def, scale) {
  Cell.apply(this, arguments);

  this._name = def._name;
  this._viewMass = this._mass;
  this._maxSpeed = 0;
  this._protection = 0;

  this._massAnimator = new Animator();

  var fontSize = Math.max((this.textSize * scale) >> 0, 8);
  this._text = new PIXI.Text(
    this._name,
    {
      'fontFamily': 'Arial',
      'fontSize': fontSize + 'pt',
      'fontWeight': 'bold',
      'fill': 0xFFFFFF,
      'stroke': blur(def._color, 80),
      'strokeThickness': 2,
      'align': 'center'
    }
  );
  fontSize = Math.max((this.textMassSize * scale) >> 0, 8);
  this._textMass = new PIXI.Text(
    this._viewMass,
    {
      'fontFamily': 'Arial',
      'fontSize': fontSize + 'pt',
      'fontWeight': 'bold',
      'fill': 0xCCCCCC,
      'stroke': blur(def._color, 80),
      'strokeThickness': 2,
      'align': 'center'
    }
  );
  this._graphics.addChild(this._text);
  this._graphics.addChild(this._textMass);
  this.updateTextPosition();

  this._graphics.on('mousedown', function (mouse) {
    var event = mouse.data.originalEvent;
    if (event.ctrlKey && !event.altKey) {
      var avatar = mouse.target.object;
      var binary = new jBinary(5);
      binary.writeUInt8(10);
      binary.writeUInt32(avatar._playerId);
      avatar._room._socket.send(binary.view.buffer);
    }
    mouse.stopPropagation();
  });

//  var baseTexture = new PIXI.BaseTexture.fromImage('img/car2.png');
//  if (baseTexture.hasLoaded) {
//    this.createSprite(baseTexture);
//  } else {
//    baseTexture.on('loaded', function() {
//      this.createSprite(baseTexture);
//    }, this);
//  }
}

Avatar.prototype = Object.create(Cell.prototype);
Avatar.prototype._className = 'Avatar';
Avatar.prototype.textSize = 24;
Avatar.prototype.textMassSize = 8;

//Avatar.prototype.createSprite = function(baseTexture) {
//  var texture = new PIXI.Texture(baseTexture);
//  this._sprite = this._graphics.addChildAt(new PIXI.Sprite(texture), 0);
//  this._sprite.anchor.x = 0.5;
//  this._sprite.anchor.y = 0.5;
//  this._spriteOrigWidth = this._sprite.width;
//};

Avatar.prototype.setScale = function (scale) {
  Cell.prototype.setScale.apply(this, arguments);
  var textStyle = this._text.style;
  textStyle['font'] = 'bold ' + (this.textSize * scale) + 'px Arial';
  this._text['style'] = textStyle;
  var textMassStyle = this._textMass.style;
  textMassStyle['font'] = 'bold ' + (this.textMassSize * scale) + 'px Arial';
  this._textMass['style'] = textMassStyle;
  this.updateTextPosition();
};

Avatar.prototype.updateTextPosition = function () {
  this._text.position.x = -this._text.width / 2;
  this._text.position.y = -this._text.height / 2;
  this._textMass.position.x = -this._textMass.width / 2;
  this._textMass.position.y = this._text.position.y + this._text.height - 0.25 * this._textMass.height;
};

//Avatar.prototype.setRadius = function (radius) {
//  Cell.prototype.setRadius.apply(this, arguments);
//  if (this._sprite) {
//    var scale  = this._scale * 2 * radius / this._spriteOrigWidth;
//    this._sprite.scale.x = scale;
//    this._sprite.scale.y = scale;
//  }
//};

Avatar.prototype.setMass = function (mass) {
  if (mass != this._mass) {
    this._mass = mass;
    this._massAnimator.init(this._viewMass, mass, Math.abs(mass - this._viewMass) <= 5 ? 0.05 : 1);
  }
};

Avatar.prototype.isSimulated = function () {
  return true;
};

Avatar.prototype.isAnimated = function () {
  return Cell.prototype.isAnimated.apply(this, arguments) || this._massAnimator.isActive();
};

Avatar.prototype.animate = function (dt) {
  Cell.prototype.animate.apply(this, arguments);
  var res = this._massAnimator.animate(dt);
  if (res !== false) {
    this._viewMass = res;
    this._textMass.text = ~~res;
    this.updateTextPosition();
  }
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @param {Room} room
 * @param {CellDef} def
 */
function Virus(room, def) {
  Cell.apply(this, arguments);
  if (def.isNew()) {
    this._viewRadius = 0;
    this._radiusAnimator.init(0, this._radius, 1);
  }
}

Virus.prototype = Object.create(Cell.prototype);
Virus.prototype._className = 'Virus';

Virus.prototype.draw = function () {
  var path = [];
  var n = 16;
  var alpha = 0;
  var angle = Math.PI / n;
  var r1 = this._viewRadius * this._scale;
  var r2 = 1.075 * this._viewRadius * this._scale;
  for (var i = 0; i <= n; ++i) {
    path.push(r1 * Math.sin(alpha), r1 * Math.cos(alpha));
    alpha += angle;
    path.push(r2 * Math.sin(alpha), r2 * Math.cos(alpha));
    alpha += angle;
  }
  this._graphics.clear();
  this._graphics.lineStyle(4, this._color, 1);
  this._graphics.beginFill(this._color, 0.85);
  this._graphics.drawPolygon(path);
  this._graphics.endFill();
};

Virus.prototype.isAnimated = function () {
  return true;
};

Virus.prototype.animate = function () {
  Cell.prototype.animate.apply(this, arguments);
  this._graphics.rotation += Math.PI / 720;
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 */
function Mother() {
  Virus.apply(this, arguments);
}

Mother.prototype = Object.create(Virus.prototype);
Mother.prototype._className = 'Mother';

Mother.prototype.animate = function () {
  Cell.prototype.animate.apply(this, arguments);
  this._graphics.rotation -= Math.PI / 720;
};
