/* global PIXI */

/**
 * @constructor
 * @param {number} id
 * @param {string} name
 * @param {number} status
 */
function PlayerInfo(id, name, status) {
  this._id = id;
  this._name = name;
  this._status = status;
}

/**
 * @constructor
 */
function Tile() {
  this._color = 0xFF00FF;
}

Tile.prototype.draw = function () {
  this._graphics.clear();
  this._graphics.lineStyle(4, this._color, 1);
  this._graphics.beginFill(this._color, 0.85);
  this._graphics.drawCircle(0, 0, this._viewRadius * this._scale);
  this._graphics.endFill();
};

Tile.prototype = Object.create(PIXI.Graphics.prototype);

/**
 * @constructor
 * @param {Config} config
 */
function Room(config) {
  this._config = config;
  this._visibleWidth = 1320;
  this._visibleHeight = 743;
  this._serverScale = 1;
  this._scaleRatio = 1;
  this._scale = 1;
  this._tick = 0;
  this._arrowPlayerX = 0;
  this._arrowPlayerY = 0;

  this._cells = new Map();
  this._player = new Player();

  this._graphics = new PIXI.Container();
  this._gridLayer = this._graphics.addChild(new PIXI.Graphics());
  this._layers = this._graphics.addChild(new PIXI.Graphics());
  this._borderLayer = this._layers.addChild(new PIXI.Graphics());
  this._wallLayer = this._layers.addChild(new PIXI.Container());
  this._foodLayer = this._layers.addChild(new PIXI.Container());
  this._cellsLayer = this._layers.addChild(new PIXI.Container());
  this._debugLayer = this._graphics.addChild(new PIXI.Graphics());
  this._textLeftTop = this._debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  this._textRightBottom = this._debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  this._rightBottomX = 0;

  this._leaderboard = this._graphics.addChild(new Leaderboard(config));
  this._leaderboard.x = 8;
  this._leaderboard.y = 8;

  this._playerInfoPanel = this._graphics.addChild(new PlayerInfoPanel(config));
  this._playerInfoPanel.x = 8;

  this._directionPanel = this._graphics.addChild(new DirectionPanel(config));
  this._directionPanel.x = this._leaderboard.x + this._leaderboard.width + 32 + 8;
  this._directionPanel.y = 32 + 8;
  this._directionPanel.visible = false;

  // this._textureTile = new PIXI.Texture.fromImage('img/tile.jpg');
}

Room.prototype.init = function () {
  Room.prototype.frame = this._initFrame;
  Room.prototype.$update = this._fakeUpdate;
  this._lastUpdate = Date.now() + 1000;
  this._serverTime = 0;
  this._clientTime = 0;
  this._cells.clear();
  this._simulatedCells = [];
  this._animatedCells = [];
  this._player.clearAvatars();
  this._foodLayer.removeChildren();
  this._cellsLayer.removeChildren();
};

Room.prototype.draw = function () {
  this.drawBorder();
  this.drawGrid();
  this._debugLayer.clear();
  if (this._scaleRatio < 1) {
    var width = this._visibleWidth * this._serverScale * this._scale;
    var height = this._visibleHeight * this._serverScale * this._scale;
    var left = 0.5 * (this._screenWidth - width);
    var right = 0.5 * (this._screenWidth + width);
    var top = 0.5 * (this._screenHeight - height);
    var bottom = 0.5 * (this._screenHeight + height);
    this._debugLayer.lineStyle(1, 0x0000FF, 0.75);
    this._debugLayer.moveTo(left, top);
    this._debugLayer.lineTo(right, top);
    this._debugLayer.lineTo(right, bottom);
    this._debugLayer.lineTo(left, bottom);
    this._debugLayer.lineTo(left, top);

    var k = 1 + 2 * this._viewportBuffer;
    width *= k;
    height *= k;
    left = 0.5 * (this._screenWidth - width);
    right = 0.5 * (this._screenWidth + width);
    top = 0.5 * (this._screenHeight - height);
    bottom = 0.5 * (this._screenHeight + height);
    this._debugLayer.lineStyle(1, 0x00FF00, 0.75);
    this._debugLayer.moveTo(left, top);
    this._debugLayer.lineTo(right, top);
    this._debugLayer.lineTo(right, bottom);
    this._debugLayer.lineTo(left, bottom);
    this._debugLayer.lineTo(left, top);

    this._textLeftTop.position.x = left;
    this._textLeftTop.position.y = top;
    this._textRightBottom.position.x = right - 120;
    this._textRightBottom.position.y = bottom - this._textRightBottom.height;
    this._rightBottomX = right;

    this._debugLayer.lineStyle(1, 0x0000FF, 1);
    this._debugLayer.beginFill(0x0000FF, 0.85);
    this._debugLayer.drawCircle(0.5 * this._screenWidth, 0.5 * this._screenHeight, 10 * this._scale);
    this._debugLayer.endFill();
  }
};

Room.prototype.drawBorder = function () {
  var height = this._height * this._scale;
  var width = this._width * this._scale;
  var borderLineStyle = this._config.borderLineStyle;
  this._borderLayer.clear();
  this._borderLayer.lineStyle(borderLineStyle[0], borderLineStyle[1], borderLineStyle[2]);
  this._borderLayer.moveTo(0, 0);
  this._borderLayer.lineTo(0, height);
  this._borderLayer.lineTo(width, height);
  this._borderLayer.lineTo(width, 0);
  this._borderLayer.lineTo(0, 0);
};

Room.prototype.drawGrid = function () {
  var gridLineStyle = this._config.gridLineStyle;
  //this._gridLayer.removeChildren();
  this._gridLayer.clear();
  this._gridLayer.lineStyle(gridLineStyle[0], gridLineStyle[1], gridLineStyle[2]);
  var gridSize = this._config.gridSize * this._scale;
  for (var i = 0; i <= this._screenWidth + gridSize; i += gridSize) {
    this._gridLayer.moveTo(i, -gridSize);
    this._gridLayer.lineTo(i, this._screenHeight + gridSize);
  }
  for (var i = 0; i <= this._screenHeight + gridSize; i += gridSize) {
    this._gridLayer.moveTo(-gridSize, i);
    this._gridLayer.lineTo(this._screenWidth + gridSize, i);
  }
//  for (var j = -gridSize; j <= this._screenHeight + gridSize; j += gridSize) {
//    for (var i = -gridSize; i <= this._screenWidth + gridSize; i += gridSize) {
//      var sprite = this._gridLayer.addChild(new PIXI.Sprite(this._textureTile));
//      var scale = this._scale * 512 / sprite.width;
//      sprite.x = i;
//      sprite.y = j;
//      sprite.scale.x = scale;
//      sprite.scale.y = scale;
//    }
//  }
};

Room.prototype._initFrame = function(now, tick, scale, cellDefs, removed) {
  Room.prototype.frame = this._frame;
  Room.prototype.$update = this._update;
  this._lastUpdate = now;
  this._tick = tick;
  this.setServerScale(scale);
  cellDefs.forEach(function (def) {
    this.modifyCell(def);
  }, this);
};

Room.prototype._frame = function(now, tick, scale, cellDefs, removed, selfAvatarsInfo) {
  this._serverTime += 50 * (tick - this._tick);
  this._tick = tick;
  this.setServerScale(scale);
  cellDefs.forEach(function (def) {
    this.modifyCell(def);
  }, this);
  removed.forEach(function (id) {
    this.removeCell(id);
  }, this);
  selfAvatarsInfo.forEach(function (item) {
    var avatar = this._cells.get(item['id']);
    avatar._maxSpeed = item['maxSpeed'];
    avatar._protection = item['protection'];
  }, this);
};

Room.prototype._fakeUpdate = function () {

};

Room.prototype._update = function () {
  var now = Date.now();
  var dt = now - this._lastUpdate;
  this._lastUpdate = now;
  this._clientTime += dt;
  dt *= 0.001;

  if (this._directionPanel.visible) {
    var angle = Math.atan2(this._arrowPlayerY - this._player._y, this._arrowPlayerX - this._player._x);
    this._directionPanel.setAngle(angle);
  }

  var playerForceRatio = 2.5;
  this._player._avatars.forEach(function (avatar) {
    if (avatar._protection > this._tick) {
      return;
    }
    var velocity = new Vec2D((this._player._x + this._pointerX - avatar._position._x), (this._player._y + this._pointerY - avatar._position._y));
    var dist = velocity.length();
    var k = dist < avatar._radius ? dist / avatar._radius : 1;
    velocity = velocity.direction().scalarProduct(k * avatar._maxSpeed);
    var force = new Vec2D(
      (velocity._x - avatar._velocity._x) * avatar._mass * playerForceRatio,
      (velocity._y - avatar._velocity._y) * avatar._mass * playerForceRatio
    );
    avatar._force.assignmentSum(force);
  }, this);

  this._simulatedCells.forEach(function (cell) {
    cell.simulate(dt);
  });
  this._simulatedCells = this._simulatedCells.filter(function (cell) {
    return cell.isSimulated();
  });
  this._animatedCells.forEach(function (cell) {
    cell.animate(dt);
  });
  this._animatedCells = this._animatedCells.filter(function (cell) {
    return cell.isAnimated();
  });

  this._player.$update();
  this._playerInfoPanel.posX = ~~this._player._x;
  this._playerInfoPanel.posY = ~~this._player._y;
  this._playerInfoPanel.mass = ~~this._player._mass;

  if (this._scaleRatio < 1) {
    var k = 0.5 * (1 + 2 * this._viewportBuffer);
    var w = k * this._visibleWidth * this._serverScale;
    var h = k * this._visibleHeight * this._serverScale;
    this._textLeftTop.text = ((this._player._x - w) >> 0) + ";" + ((this._player._y - h) >> 0);
    this._textRightBottom.text = ((this._player._x + w) >> 0) + ";" + ((this._player._y + h) >> 0);
    this._textRightBottom.position.x = this._rightBottomX - this._textRightBottom.width;
  }

  var x = 0.5 * this._screenWidth - this._player._x * this._scale;
  var y = 0.5 * this._screenHeight - this._player._y * this._scale;
  this._layers.position.x = x;
  this._layers.position.y = y;
  var gridSize = this._config.gridSize * this._scale;
  this._gridLayer.position.x = x % gridSize;
  this._gridLayer.position.y = y % gridSize;
};

Room.prototype.setScreenSize = function (width, height) {
  this._screenWidth = width;
  this._screenHeight = height;
  this._playerInfoPanel.y = height - this._playerInfoPanel.height - 8;
  this.onChangeScale();
};

Room.prototype.setScaleRatio = function (ratio) {
  this._scaleRatio = ratio;
  if (ratio <= 1) {
    this._textLeftTop.text = '';
    this._textRightBottom.text = '';
  }
  this.onChangeScale();
};

Room.prototype.setServerScale = function (scale) {
  if (Math.abs(this._serverScale - scale) > 0.01) {
    this._serverScale = scale;
    this.onChangeScale();
  }
};

Room.prototype.onChangeScale = function () {
  this._scale = this._scaleRatio * this._screenHeight / (this._visibleHeight * this._serverScale);
  this.draw();
  this._cells.forEach(function(cell) {
    cell.setScale(this._scale);
  }, this);
};

Room.prototype.play = function (playerId, x, y, maxMass) {
  this.init();
  this._leaderboard.playerId = playerId;
  this._playerInfoPanel.maxMass = maxMass;
  this._player._id = playerId;
  this._player._x = x;
  this._player._y = y;
  this._leaderboard.onMouseDown = (mouse) => {
    var event = mouse.data.originalEvent;
    if (event.ctrlKey) {
      var binary = new jBinary(5);
      binary.writeUInt8(10);
      binary.writeUInt32(mouse.target.playerId);
      this._socket.send(binary.view.buffer);
    }
    mouse.stopPropagation();
  };
};

Room.prototype.setCellAsSimulated = function (cell) {
  if (this._simulatedCells.indexOf(cell) == -1) {
    this._simulatedCells.push(cell);
  }
};

Room.prototype.setCellAsAnimated = function (cell) {
  if (this._animatedCells.indexOf(cell) == -1) {
    this._animatedCells.push(cell);
  }
};

/**
 * @param {CellDef} def
 */
Room.prototype.modifyCell = function (def) {
  /** @type {Cell} cell */
  var cell = this._cells.get(def._id);
  if (cell) {
    cell.modify(def);
  } else {
    if (def.isFood()) {
      cell = new Food(this, def, this._scale);
    } else if (def.isMass()) {
      cell = new Mass(this, def, this._scale);
    } else if (def.isAvatar()) {
      cell = new Avatar(this, def, this._scale);
    } else if (def.isVirus()) {
      cell = new Virus(this, def, this._scale);
    } else if (def.isMother()) {
      cell = new Mother(this, def, this._scale);
    } else {
      cell = new Cell(this, def, this._scale);
    }
    this._cells.set(cell._id, cell);
    if (def.isFood()) {
      this._foodLayer.addChild(cell._graphics);
    } else {
      this._cellsLayer.addChild(cell._graphics);
      if (cell._playerId == this._player._id) {
        this._player.addAvatar(cell);
      }
    }
    cell.draw();
  }

  if (cell.isSimulated()) {
    this.setCellAsSimulated(cell);
  }
  if (cell.isAnimated()) {
    this.setCellAsAnimated(cell);
  }

  // TODO: можливо краще відкладено сортувати клітинки
  if (!def.isFood()) {
    this._cellsLayer.children.forEach(function (item, i) {
      item.index = i;
    });
    this._cellsLayer.children.sort(function (a, b) {
      var res = a.object._mass - b.object._mass;
      return res == 0 ? a.index - b.index : res;
    });
  }
};

Room.prototype.removeCell = function (cellId) {
  var cell = this._cells.get(cellId);
  if (cell) {
    var index = this._simulatedCells.indexOf(cell);
    if (index != -1) {
      this._simulatedCells.splice(index, 1);
    }
    index = this._animatedCells.indexOf(cell);
    if (index != -1) {
      this._animatedCells.splice(index, 1);
    }
    if (cell._playerId == this._player._id) {
      this._player.removeAvatar(cell);
    }
    cell._graphics.parent.removeChild(cell._graphics);
    this._cells.delete(cellId);
  }
};
