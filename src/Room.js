import * as PIXI from 'pixi.js';

export default class Room extends PIXI.Container {
  config = null;

  visibleWidth = 1320;
  visibleHeight = 743;
  serverScale = 1;
  scaleRatio = 1;
  scale = 1;
  tick = 0;
  arrowPlayerX = 0;
  arrowPlayerY = 0;

  cells = new Map();
  // player = new Player(); // TODO: implement

  screenWidth = 640;
  screenHeight = 480;
  height = 1000;
  width = 2000;

  gridLayer = this.addChild(new PIXI.Graphics());
  layers = this.addChild(new PIXI.Graphics());
  borderLayer = this.layers.addChild(new PIXI.Graphics());
  foodLayer = this.layers.addChild(new PIXI.Container());
  cellsLayer = this.layers.addChild(new PIXI.Container());
  debugLayer = this.addChild(new PIXI.Graphics());

  textLeftTop = this.debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  textRightBottom = this.debugLayer.addChild(new PIXI.Text('', {font : '20px Arial', fill : 0xff1010, align : 'center'}));
  rightBottomX = 0;

  // leaderboard = this.graphics.addChild(new Leaderboard(config));
  // playerInfoPanel = this.graphics.addChild(new PlayerInfoPanel(config));
  // directionPanel = this.graphics.addChild(new DirectionPanel(config));

  constructor(view, config) {
    super();

    this.config = config;

    // this.leaderboard.x = 8;
    // this.leaderboard.y = 8;
    //
    // this.playerInfoPanel.x = 8;
    //
    // this.directionPanel.x = this.leaderboard.x + this.leaderboard.width + 32 + 8;
    // this.directionPanel.y = 32 + 8;
    // this.directionPanel.visible = false;

    view.addChild(this);
  }

// Room.prototype.init = function () {
//   Room.prototype.frame = this.initFrame;
//   Room.prototype.$update = this.fakeUpdate;
//   this.lastUpdate = Date.now() + 1000;
//   this.serverTime = 0;
//   this.clientTime = 0;
//   this.cells.clear();
//   this.simulatedCells = [];
//   this.animatedCells = [];
//   this.player.clearAvatars();
//   this.foodLayer.removeChildren();
//   this.cellsLayer.removeChildren();
// };

  draw() {
    this.drawBorder();
    this.drawGrid();
    this.debugLayer.clear();
    if (this.scaleRatio < 1) { // TODO: move to separate function
      let width = this.visibleWidth * this.serverScale * this.scale;
      let height = this.visibleHeight * this.serverScale * this.scale;
      let left = 0.5 * (this.screenWidth - width);
      let right = 0.5 * (this.screenWidth + width);
      let top = 0.5 * (this.screenHeight - height);
      let bottom = 0.5 * (this.screenHeight + height);
      this.debugLayer.lineStyle(1, 0x0000FF, 0.75);
      this.debugLayer.moveTo(left, top);
      this.debugLayer.lineTo(right, top);
      this.debugLayer.lineTo(right, bottom);
      this.debugLayer.lineTo(left, bottom);
      this.debugLayer.lineTo(left, top);

      let k = 1 + 2 * this.viewportBuffer;
      width *= k;
      height *= k;
      left = 0.5 * (this.screenWidth - width);
      right = 0.5 * (this.screenWidth + width);
      top = 0.5 * (this.screenHeight - height);
      bottom = 0.5 * (this.screenHeight + height);
      this.debugLayer.lineStyle(1, 0x00FF00, 0.75);
      this.debugLayer.moveTo(left, top);
      this.debugLayer.lineTo(right, top);
      this.debugLayer.lineTo(right, bottom);
      this.debugLayer.lineTo(left, bottom);
      this.debugLayer.lineTo(left, top);

      this.textLeftTop.position.x = left;
      this.textLeftTop.position.y = top;
      this.textRightBottom.position.x = right - 120;
      this.textRightBottom.position.y = bottom - this.textRightBottom.height;
      this.rightBottomX = right;

      this.debugLayer.lineStyle(1, 0x0000FF, 1);
      this.debugLayer.beginFill(0x0000FF, 0.85);
      this.debugLayer.drawCircle(0.5 * this.screenWidth, 0.5 * this.screenHeight, 10 * this.scale);
      this.debugLayer.endFill();
    }
  };

  drawBorder() {
    let height = this.height * this.scale;
    let width = this.width * this.scale;
    this.borderLayer.clear();
    this.borderLayer.lineStyle(this.config.borderLineStyle);
    this.borderLayer.moveTo(0, 0);
    this.borderLayer.lineTo(0, height);
    this.borderLayer.lineTo(width, height);
    this.borderLayer.lineTo(width, 0);
    this.borderLayer.lineTo(0, 0);
  };

  drawGrid() {
    this.gridLayer.clear();
    this.gridLayer.lineStyle(this.config.gridLineStyle);
    let gridSize = this.config.gridSize * this.scale;
    for (let i = 0; i <= this.screenWidth + gridSize; i += gridSize) {
      this.gridLayer.moveTo(i, -gridSize);
      this.gridLayer.lineTo(i, this.screenHeight + gridSize);
    }
    for (let i = 0; i <= this.screenHeight + gridSize; i += gridSize) {
      this.gridLayer.moveTo(-gridSize, i);
      this.gridLayer.lineTo(this.screenWidth + gridSize, i);
    }
  };

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
//
// Room.prototype._frame = function(now, tick, scale, cellDefs, removed, selfAvatarsInfo) {
//   this.serverTime += 50 * (tick - this.tick);
//   this.tick = tick;
//   this.setServerScale(scale);
//   cellDefs.forEach(function (def) {
//     this.modifyCell(def);
//   }, this);
//   removed.forEach(function (id) {
//     this.removeCell(id);
//   }, this);
//   selfAvatarsInfo.forEach(function (item) {
//     let avatar = this.cells.get(item['id']);
//     avatar._maxSpeed = item['maxSpeed'];
//     avatar._protection = item['protection'];
//   }, this);
// };

  update() {
    let now = Date.now();
    let dt = now - this.lastUpdate;
    this.lastUpdate = now;
    this.clientTime += dt;
    dt *= 0.001;

    if (this.directionPanel.visible) {
      let angle = Math.atan2(this.arrowPlayerY - this.player._y, this.arrowPlayerX - this.player._x);
      this.directionPanel.setAngle(angle);
    }

    let playerForceRatio = 2.5;
    this.player._avatars.forEach(function (avatar) {
      if (avatar._protection > this.tick) {
        return;
      }
      let velocity = new Vec2D((this.player._x + this.pointerX - avatar._position._x), (this.player._y + this.pointerY - avatar._position._y));
      let dist = velocity.length();
      let k = dist < avatar._radius ? dist / avatar._radius : 1;
      velocity = velocity.direction().scalarProduct(k * avatar._maxSpeed);
      let force = new Vec2D(
        (velocity._x - avatar._velocity._x) * avatar._mass * playerForceRatio,
        (velocity._y - avatar._velocity._y) * avatar._mass * playerForceRatio
      );
      avatar._force.assignmentSum(force);
    }, this);

    this.simulatedCells.forEach(function (cell) {
      cell.simulate(dt);
    });
    this.simulatedCells = this.simulatedCells.filter(function (cell) {
      return cell.isSimulated();
    });
    this.animatedCells.forEach(function (cell) {
      cell.animate(dt);
    });
    this.animatedCells = this.animatedCells.filter(function (cell) {
      return cell.isAnimated();
    });

    this.player.$update();
    this.playerInfoPanel.posX = ~~this.player._x;
    this.playerInfoPanel.posY = ~~this.player._y;
    this.playerInfoPanel.mass = ~~this.player._mass;

    if (this.scaleRatio < 1) {
      let k = 0.5 * (1 + 2 * this.viewportBuffer);
      let w = k * this.visibleWidth * this.serverScale;
      let h = k * this.visibleHeight * this.serverScale;
      this.textLeftTop.text = ((this.player._x - w) >> 0) + ";" + ((this.player._y - h) >> 0);
      this.textRightBottom.text = ((this.player._x + w) >> 0) + ";" + ((this.player._y + h) >> 0);
      this.textRightBottom.position.x = this.rightBottomX - this.textRightBottom.width;
    }

    let x = 0.5 * this.screenWidth - this.player._x * this.scale;
    let y = 0.5 * this.screenHeight - this.player._y * this.scale;
    this.layers.position.x = x;
    this.layers.position.y = y;
    let gridSize = this.config.gridSize * this.scale;
    this.gridLayer.position.x = x % gridSize;
    this.gridLayer.position.y = y % gridSize;
  };

  setScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
    this.playerInfoPanel.y = height - this.playerInfoPanel.height - 8;
    this.onChangeScale();
  };

  setScaleRatio(ratio) {
    this.scaleRatio = ratio;
    if (ratio <= 1) {
      this.textLeftTop.text = '';
      this.textRightBottom.text = '';
    }
    this.onChangeScale();
  };

  setServerScale(scale) {
    if (Math.abs(this.serverScale - scale) > 0.01) {
      this.serverScale = scale;
      this.onChangeScale();
    }
  };

  onChangeScale() {
    this.scale = this.scaleRatio * this.screenHeight / (this.visibleHeight * this.serverScale);
    this.draw();
    this.cells.forEach(function(cell) {
      cell.setScale(this.scale);
    }, this);
  };

// Room.prototype.play = function (playerId, x, y, maxMass) {
//   this.init();
//   this.leaderboard.playerId = playerId;
//   this.playerInfoPanel.maxMass = maxMass;
//   this.player._id = playerId;
//   this.player._x = x;
//   this.player._y = y;
//   this.leaderboard.onMouseDown = (mouse) => {
//     let event = mouse.data.originalEvent;
//     if (event.ctrlKey) {
//       let binary = new jBinary(5);
//       binary.writeUInt8(10);
//       binary.writeUInt32(mouse.target.playerId);
//       this.socket.send(binary.view.buffer);
//     }
//     mouse.stopPropagation();
//   };
// };
//
  setCellAsSimulated(cell) {
    if (this.simulatedCells.indexOf(cell) === -1) {
      this.simulatedCells.push(cell);
    }
  };

  setCellAsAnimated(cell) {
    if (this.animatedCells.indexOf(cell) === -1) {
      this.animatedCells.push(cell);
    }
  };

  /** @param {CellDef} def */
  modifyCell(def) {
    /** @type {Cell} cell */
    let cell = this.cells.get(def.id);
    if (cell) {
      cell.modify(def);
    } else {
      if (def.isFood()) {
        cell = new Food(this, def, this.scale);
      } else if (def.isMass()) {
        cell = new Mass(this, def, this.scale);
      } else if (def.isAvatar()) {
        cell = new Avatar(this, def, this.scale);
      } else if (def.isVirus()) {
        cell = new Virus(this, def, this.scale);
      } else if (def.isMother()) {
        cell = new Mother(this, def, this.scale);
      } else {
        cell = new Cell(this, def, this.scale);
      }
      this.cells.set(cell.id, cell);
      if (def.isFood()) {
        this.foodLayer.addChild(cell.graphics);
      } else {
        this.cellsLayer.addChild(cell.graphics);
        if (cell.playerId === this.player.id) {
          this.player.addAvatar(cell);
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
      this.cellsLayer.children.forEach(function (item, i) {
        item.index = i;
      });
      this.cellsLayer.children.sort(function (a, b) {
        let res = a.object.mass - b.object.mass;
        return res === 0 ? a.index - b.index : res;
      });
    }
  };

  removeCell(cellId) {
    let cell = this.cells.get(cellId);
    if (cell) {
      let index = this.simulatedCells.indexOf(cell);
      if (index !== -1) {
        this.simulatedCells.splice(index, 1);
      }
      index = this.animatedCells.indexOf(cell);
      if (index !== -1) {
        this.animatedCells.splice(index, 1);
      }
      if (cell.playerId === this.player.id) {
        this.player.removeAvatar(cell);
      }
      cell.graphics.parent.removeChild(cell.graphics); // TODO: encapsulate logic
      this.cells.delete(cellId);
    }
  };
}