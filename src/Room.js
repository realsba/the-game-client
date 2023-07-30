import * as PIXI from 'pixi.js';
import PlayerInfoPanel from './PlayerInfoPanel.js';
import Leaderboard from './Leaderboard.js';
import InfoPanel from './InfoPanel.js';
import Player from './Player.js';
import BinaryStream from './BinaryStream.js';

export default class Room extends PIXI.Container {
  _visibleWidth = 1320;
  _visibleHeight = 743;
  _serverScale = 1;
  _scaleRatio = 1;
  _scale = 1;
  tick = 0;
  arrowPlayerX = 0;
  arrowPlayerY = 0;
  _simulatedCells;
  _animatedCells;

  _cells = new Map();
  _player = new Player();

  _screenWidth = 640;
  _screenHeight = 480;

  _gridLayer = this.addChild(new PIXI.Graphics());
  _layers = this.addChild(new PIXI.Graphics());
  _borderLayer = this._layers.addChild(new PIXI.Graphics());
  _foodLayer = this._layers.addChild(new PIXI.Container());
  _cellsLayer = this._layers.addChild(new PIXI.Container());
  _debugLayer = this.addChild(new PIXI.Graphics());

  _textLeftTop = this._debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  _textRightBottom = this._debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  _rightBottomX = 0;

  constructor(view, config) {
    super();

    this._config = config;

    this._leaderboard = new Leaderboard(this, config.leaderboard);
    this._leaderboard.x = 8;
    this._leaderboard.y = 8;

    this._playerInfoPanel = new PlayerInfoPanel(this, config.playerInfoPanel);
    this._playerInfoPanel.x = 8;
    this._playerInfoPanel.onResize = () => this.placePlayerInfoPanel();

    this._infoPanel = new InfoPanel(this, config.infoPanel);
    this._infoPanel.y = 8;
    this._infoPanel.onResize = () => this.placeInfoPanel();

    //directionPanel = this.graphics.addChild(new DirectionPanel(config));
    // this.directionPanel.x = this.leaderboard.x + this.leaderboard.width + 32 + 8;
    // this.directionPanel.y = 32 + 8;
    // this.directionPanel.visible = false;

    view.addChild(this);
  }

  get infoPanel() {
    return this._infoPanel;
  }

  init() {
   Room.prototype.frame = this.initFrame;
   Room.prototype.$update = this.fakeUpdate;
    this.lastUpdate = Date.now() + 1000;
    this._cells.clear();
    this._simulatedCells = [];
    this._animatedCells = [];
    this._player.clearAvatars();
    this._foodLayer.removeChildren();
    this._cellsLayer.removeChildren();
  }

  draw() {
    this.drawBorder();
    this.drawGrid();
    this._debugLayer.clear();
    if (this._scaleRatio < 1) { // TODO: move to separate function
      let width = this._visibleWidth * this._serverScale * this._scale;
      let height = this._visibleHeight * this._serverScale * this._scale;
      let left = 0.5 * (this._screenWidth - width);
      let right = 0.5 * (this._screenWidth + width);
      let top = 0.5 * (this._screenHeight - height);
      let bottom = 0.5 * (this._screenHeight + height);
      this._debugLayer.lineStyle(1, 0x0000FF, 0.75);
      this._debugLayer.moveTo(left, top);
      this._debugLayer.lineTo(right, top);
      this._debugLayer.lineTo(right, bottom);
      this._debugLayer.lineTo(left, bottom);
      this._debugLayer.lineTo(left, top);

      let k = 1 + 2 * this.viewportBuffer;
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
  }

  drawBorder() {
    let height = this.height * this._scale; // TODO: what is this.height?
    let width = this.width * this._scale;
    this._borderLayer.clear();
    this._borderLayer.lineStyle(this._config.borderLineStyle);
    this._borderLayer.moveTo(0, 0);
    this._borderLayer.lineTo(0, height);
    this._borderLayer.lineTo(width, height);
    this._borderLayer.lineTo(width, 0);
    this._borderLayer.lineTo(0, 0);
  }

  drawGrid() {
    this._gridLayer.clear();
    this._gridLayer.lineStyle(this._config.gridLineStyle);
    let gridSize = this._config.gridSize * this._scale;
    for (let i = 0; i <= this._screenWidth + gridSize; i += gridSize) {
      this._gridLayer.moveTo(i, -gridSize);
      this._gridLayer.lineTo(i, this._screenHeight + gridSize);
    }
    for (let i = 0; i <= this._screenHeight + gridSize; i += gridSize) {
      this._gridLayer.moveTo(-gridSize, i);
      this._gridLayer.lineTo(this._screenWidth + gridSize, i);
    }
  }

// Room.prototype._initFrame = function(now, tick, scale, cellDefs, removed) {
//   Room.prototype.frame = this.frame;
//   Room.prototype.$update = this.update;
//   this.lastUpdate = now;
//   this.tick = tick;
//   this.setServerScale(scale);
//   cellDefs.forEach(function (def) {
//     this.modifyCell(def);
//   }, this);
// };

// Room.prototype._frame = function(now, tick, scale, cellDefs, removed, selfAvatarsInfo) {
//   this.tick = tick;
//   this.setServerScale(scale);
//   cellDefs.forEach(function (def) {
//     this.modifyCell(def);
//   }, this);
//   removed.forEach(function (id) {
//     this.removeCell(id);
//   }, this);
//   selfAvatarsInfo.forEach(function (item) {
//     let avatar = this._cells.get(item['id']);
//     avatar._maxSpeed = item['maxSpeed'];
//     avatar._protection = item['protection'];
//   }, this);
// };

  update() {
    let now = Date.now();
    let dt = now - this.lastUpdate;
    this.lastUpdate = now;
    dt *= 0.001;

    // TODO: implement
    // if (this.directionPanel.visible) {
    //   let angle = Math.atan2(this.arrowPlayerY - this._player._y, this.arrowPlayerX - this._player._x);
    //   this.directionPanel.setAngle(angle);
    // }

    // let playerForceRatio = 2.5;
    // this._player._avatars.forEach(function (avatar) {
    //   if (avatar._protection > this.tick) {
    //     return;
    //   }
    //   let velocity = new Vec2D((this._player._x + this.pointerX - avatar._position._x), (this._player._y + this.pointerY - avatar._position._y));
    //   let dist = velocity.length();
    //   let k = dist < avatar._radius ? dist / avatar._radius : 1;
    //   velocity = velocity.direction().scalarProduct(k * avatar._maxSpeed);
    //   let force = new Vec2D(
    //     (velocity._x - avatar._velocity._x) * avatar._mass * playerForceRatio,
    //     (velocity._y - avatar._velocity._y) * avatar._mass * playerForceRatio
    //   );
    //   avatar._force.assignmentSum(force);
    // }, this);
    //
    // this._simulatedCells.forEach(function (cell) {
    //   cell.simulate(dt);
    // });
    // this._simulatedCells = this._simulatedCells.filter(function (cell) {
    //   return cell.isSimulated();
    // });
    // this._animatedCells.forEach(function (cell) {
    //   cell.animate(dt);
    // });
    // this._animatedCells = this._animatedCells.filter(function (cell) {
    //   return cell.isAnimated();
    // });

    this._player.update();
    this._playerInfoPanel.posX = ~~this._player.x;
    this._playerInfoPanel.posY = ~~this._player.y;
    this._playerInfoPanel.mass = ~~this._player.mass;

    if (this._scaleRatio < 1) {
      let k = 0.5 * (1 + 2 * this.viewportBuffer);
      let w = k * this._visibleWidth * this._serverScale;
      let h = k * this._visibleHeight * this._serverScale;
      this._textLeftTop.text = ((this._player._x - w) >> 0) + ";" + ((this._player._y - h) >> 0);
      this._textRightBottom.text = ((this._player._x + w) >> 0) + ";" + ((this._player._y + h) >> 0);
      this._textRightBottom.position.x = this._rightBottomX - this._textRightBottom.width;
    }

    let x = 0.5 * this._screenWidth - this._player._x * this._scale;
    let y = 0.5 * this._screenHeight - this._player._y * this._scale;
    this._layers.position.x = x;
    this._layers.position.y = y;
    let gridSize = this._config.gridSize * this._scale;
    this._gridLayer.position.x = x % gridSize;
    this._gridLayer.position.y = y % gridSize;
  }

  placePlayerInfoPanel() {
    this._playerInfoPanel.y = this._screenHeight - this._playerInfoPanel.height - 8;
  }

  placeInfoPanel() {
    this._infoPanel.x = this._screenWidth - this._infoPanel.width - 8;
  }

  setScreenSize(width, height) {
    this._screenWidth = width;
    this._screenHeight = height;
    this.placePlayerInfoPanel();
    this.placeInfoPanel();
    this.onChangeScale();
  }

  setScaleRatio(ratio) {
    this._scaleRatio = ratio;
    if (ratio <= 1) {
      this._textLeftTop.text = '';
      this._textRightBottom.text = '';
    }
    this.onChangeScale();
  }

  setServerScale(scale) {
    if (Math.abs(this._serverScale - scale) > 0.01) {
      this._serverScale = scale;
      this.onChangeScale();
    }
  }

  onChangeScale() {
    this._scale = this._scaleRatio * this._screenHeight / (this._visibleHeight * this._serverScale);
    this.draw();
    this._cells.forEach(function(cell) {
      cell.setScale(this.scale);
    }, this);
  }

  play(playerId, x, y, maxMass) {
    this.init();
    this._leaderboard.playerId = playerId;
    this._playerInfoPanel.maxMass = maxMass;
    this._player._id = playerId;
    this._player._x = x;
    this._player._y = y;
    this._leaderboard.onMouseDown = (mouse) => {
      const event = mouse.data.originalEvent;
      if (event.ctrlKey) {
        const stream = new BinaryStream(5);
        stream.writeUInt8(10);
        stream.writeUInt32(mouse.target.playerId);
        this.socket.send(stream.buffer);
      }
      mouse.stopPropagation();
    };
  };

  setCellAsSimulated(cell) {
    if (this._simulatedCells.indexOf(cell) === -1) {
      this._simulatedCells.push(cell);
    }
  }

  setCellAsAnimated(cell) {
    if (this._animatedCells.indexOf(cell) === -1) {
      this._animatedCells.push(cell);
    }
  }

  modifyCell(def) {
    /** @type {Cell} cell */
    let cell = this._cells.get(def.id);
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
      this._cells.set(cell.id, cell);
      if (def.isFood()) {
        this._foodLayer.addChild(cell.graphics);
      } else {
        this._cellsLayer.addChild(cell.graphics);
        if (cell.playerId === this._player.id) {
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
        let res = a.object.mass - b.object.mass;
        return res === 0 ? a.index - b.index : res;
      });
    }
  }

  removeCell(cellId) {
    let cell = this._cells.get(cellId);
    if (cell) {
      let index = this._simulatedCells.indexOf(cell);
      if (index !== -1) {
        this._simulatedCells.splice(index, 1);
      }
      index = this._animatedCells.indexOf(cell);
      if (index !== -1) {
        this._animatedCells.splice(index, 1);
      }
      if (cell.playerId === this._player.id) {
        this._player.removeAvatar(cell);
      }
      cell.graphics.parent.removeChild(cell.graphics); // TODO: encapsulate logic
      this._cells.delete(cellId);
    }
  }
}