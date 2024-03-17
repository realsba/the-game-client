import * as PIXI from 'pixi.js';
import PlayerInfoPanel from './PlayerInfoPanel.js';
import Leaderboard from './Leaderboard.js';
import InfoPanel from './InfoPanel.js';
import DirectionPanel from './DirectionPanel.js';
import Player from './Player.js';
import { Cell, Avatar, Food, Mass, Virus, Mother } from './Cell.js';
import Vec2D from './Vec2D.js';

export default class Room extends PIXI.Container {
  _visibleWidth = 1320;
  _visibleHeight = 743;
  #screenWidth = 640;
  #screenHeight = 480;

  _originalWidth;
  _originalHeight;
  _viewportBuffer;

  #serverScale = 1;
  #scaleRatio = 1;
  _scale = 1;

  _arrowPlayerX = 0;
  _arrowPlayerY = 0;
  #simulatedCells = new Set();
  #animatedCells = new Set();

  #cells = new Map();
  _player = new Player();

  #gridLayer = this.addChild(new PIXI.Graphics());
  #layers = this.addChild(new PIXI.Graphics());
  #borderLayer = this.#layers.addChild(new PIXI.Graphics());
  #foodLayer = this.#layers.addChild(new PIXI.Container());
  #cellsLayer = this.#layers.addChild(new PIXI.Container());
  #debugLayer = this.addChild(new PIXI.Graphics());

  #textLeftTop = this.#debugLayer.addChild(
    new PIXI.Text('', {fontFamily: 'Arial', fontSize: '12pt', fill: 0xff1010, align: 'center'})
  );
  #textRightBottom = this.#debugLayer.addChild(
    new PIXI.Text('', {fontFamily: 'Arial', fontSize: '12pt', fill : 0xff1010, align : 'center'})
  );
  #rightBottomX = 0;

  /** @type {Leaderboard} */
  #leaderboard;
  /** @type {PlayerInfoPanel} */
  #playerInfoPanel;
  /** @type {InfoPanel} */
  #infoPanel;
  /** @type {DirectionPanel} */
  #directionPanel;

  _pointerX;
  _pointerY;

  #onCreateAvatar;

  constructor(view, config) {
    super();

    this._config = config;

    this.#leaderboard = new Leaderboard(this, config.leaderboard);
    this.#leaderboard.x = 8;
    this.#leaderboard.y = 8;

    this.#playerInfoPanel = new PlayerInfoPanel(this, config.playerInfoPanel);
    this.#playerInfoPanel.x = 8;
    this.#playerInfoPanel.onResize = () => this.#placePlayerInfoPanel();

    this.#infoPanel = new InfoPanel(this, config.infoPanel);
    this.#infoPanel.y = 8;
    this.#infoPanel.onResize = () => this.#placeInfoPanel();

    this.#directionPanel = this.addChild(new DirectionPanel(config.directionPanel));
    this.#directionPanel.x = this.#leaderboard.x + this.#leaderboard.width + 32 + 8;
    this.#directionPanel.y = 32 + 8;
    this.#directionPanel.visible = false;

    view.addChild(this);
  }

  get infoPanel() {
    return this.#infoPanel;
  }

  get leaderboard() {
    return this.#leaderboard;
  }

  get directionPanel() {
    return this.#directionPanel;
  }

  set onCreateAvatar(value) {
    this.#onCreateAvatar = value;
  }

  init() {
    this.frame = this.initFrame;
    this.update = () => {};
    this.lastUpdate = Date.now() + 1000;
    this.#cells.clear();
    this.#simulatedCells.clear();
    this.#animatedCells.clear();
    this._player.clearAvatars();
    this.#foodLayer.removeChildren();
    this.#cellsLayer.removeChildren();
  }

  draw() {
    this.#drawBorder();
    this.#drawGrid();
    this.#drawDebugLayer();
  }

  #drawBorder() {
    this.#borderLayer.clear();
    this.#borderLayer.lineStyle(this._config.borderLineStyle);
    this.#borderLayer.drawRect(
      0, 0, this._originalWidth * this._scale, this._originalHeight * this._scale
    );
  }

  #drawGrid() {
    this.#gridLayer.clear();
    this.#gridLayer.lineStyle(this._config.gridLineStyle);
    const gridSize = this._config.gridSize * this._scale;
    for (let i = 0; i <= this.#screenWidth + gridSize; i += gridSize) {
      this.#gridLayer.moveTo(i, -gridSize);
      this.#gridLayer.lineTo(i, this.#screenHeight + gridSize);
    }
    for (let i = 0; i <= this.#screenHeight + gridSize; i += gridSize) {
      this.#gridLayer.moveTo(-gridSize, i);
      this.#gridLayer.lineTo(this.#screenWidth + gridSize, i);
    }
  }

  #drawDebugLayer() {
    this.#debugLayer.clear();
    if (this.#scaleRatio < 1) {
      let width = this._visibleWidth * this.#serverScale * this._scale;
      let height = this._visibleHeight * this.#serverScale * this._scale;
      let left = 0.5 * (this.#screenWidth - width);
      let top = 0.5 * (this.#screenHeight - height);
      this.#debugLayer.lineStyle(1, 0x0000FF, 0.75);
      this.#debugLayer.drawRect(left, top, width, height);

      const k = 1 + 2 * this._viewportBuffer;
      width *= k;
      height *= k;
      left = 0.5 * (this.#screenWidth - width);
      top = 0.5 * (this.#screenHeight - height);
      const right = 0.5 * (this.#screenWidth + width);
      const bottom = 0.5 * (this.#screenHeight + height);
      this.#debugLayer.lineStyle(1, 0x00FF00, 0.75);
      this.#debugLayer.drawRect(left, top, width, height);

      this.#textLeftTop.position.x = left;
      this.#textLeftTop.position.y = top;
      this.#textRightBottom.position.x = right - 120;
      this.#textRightBottom.position.y = bottom - this.#textRightBottom.height;
      this.#rightBottomX = right;

      this.#debugLayer.lineStyle(1, 0x0000FF, 1);
      this.#debugLayer.beginFill(0x0000FF, 0.85);
      this.#debugLayer.drawCircle(0.5 * this.#screenWidth, 0.5 * this.#screenHeight, 10 * this._scale);
      this.#debugLayer.endFill();
    }
  }

  initFrame(now, serverScale, cellDefs) {
    this.frame = this._frame;
    this.update = this._update;
    this.lastUpdate = now;
    this.#setServerScale(serverScale);
    cellDefs.forEach(def => this.modifyCell(def));
  };

  _frame(now, serverScale, cellDefs, removed, selfAvatarsInfo) {
    this.#setServerScale(serverScale);
    removed.forEach(id => this.removeCell(id));
    cellDefs.forEach(def => this.modifyCell(def));
    selfAvatarsInfo.forEach(item => {
      /** @type {Avatar} */
      const avatar = this.#cells.get(item.id);
      if (avatar) {
        avatar._maxSpeed = item.maxSpeed; // TODO: avoid using protected members
      }
    });
  };

  _update() {
    let now = Date.now();
    let dt = now - this.lastUpdate;
    this.lastUpdate = now;
    dt *= 0.001;

    if (this.#directionPanel.visible) {
      const angle = Math.atan2(this._arrowPlayerY - this._player.y, this._arrowPlayerX - this._player.x);
      this.#directionPanel.setAngle(angle);
    }

    const playerForceRatio = 2.5;
    // TODO: avoid using protected members from this._player
    this._player._avatars.forEach(avatar => {
      let velocity = new Vec2D((this._player.x + this._pointerX - avatar._position.x), (this._player.y + this._pointerY - avatar._position.y));
      const dist = velocity.length();
      const k = dist < avatar._radius ? dist / avatar._radius : 1;
      velocity = velocity.direction().scalarProduct(k * avatar._maxSpeed);
      const force = new Vec2D(
        (velocity.x - avatar._velocity.x) * avatar._mass * playerForceRatio,
        (velocity.y - avatar._velocity.y) * avatar._mass * playerForceRatio
      );
      avatar._force.assignmentSum(force);
    });

    this.#simulatedCells.forEach(cell => {
      cell.simulate(dt);
      if (!cell.isSimulated()) {
        this.#simulatedCells.delete(cell);
      }
    });
    this.#animatedCells.forEach(cell => {
      cell.animate(dt);
      if (!cell.isAnimated()) {
        this.#animatedCells.delete(cell);
      }
    });

    this._player.update();
    this.#playerInfoPanel.posX = ~~this._player.x;
    this.#playerInfoPanel.posY = ~~this._player.y;
    this.#playerInfoPanel.mass = ~~this._player.mass;

    if (this.#scaleRatio < 1) {
      let k = 0.5 * (1 + 2 * this._viewportBuffer);
      let w = k * this._visibleWidth * this.#serverScale;
      let h = k * this._visibleHeight * this.#serverScale;
      this.#textLeftTop.text = ((this._player.x - w) >> 0) + ";" + ((this._player.y - h) >> 0);
      this.#textRightBottom.text = ((this._player.x + w) >> 0) + ";" + ((this._player.y + h) >> 0);
      this.#textRightBottom.position.x = this.#rightBottomX - this.#textRightBottom.width;
    }

    const x = 0.5 * this.#screenWidth - this._player.x * this._scale;
    const y = 0.5 * this.#screenHeight - this._player.y * this._scale;
    this.#layers.position.x = x;
    this.#layers.position.y = y;
    const gridSize = this._config.gridSize * this._scale;
    this.#gridLayer.position.x = x % gridSize;
    this.#gridLayer.position.y = y % gridSize;
  }

  #placePlayerInfoPanel() {
    this.#playerInfoPanel.y = this.#screenHeight - this.#playerInfoPanel.height - 8;
  }

  #placeInfoPanel() {
    this.#infoPanel.x = this.#screenWidth - this.#infoPanel.width - 8;
  }

  setScreenSize(width, height) {
    this.#screenWidth = width;
    this.#screenHeight = height;
    this.#placePlayerInfoPanel();
    this.#placeInfoPanel();
    this.#onChangeScale();
  }

  setScaleRatio(ratio) {
    this.#scaleRatio = ratio;
    if (ratio <= 1) {
      this.#textLeftTop.text = '';
      this.#textRightBottom.text = '';
    }
    this.#onChangeScale();
  }

  #setServerScale(scale) {
    if (Math.abs(this.#serverScale - scale) > 0.01) {
      this.#serverScale = scale;
      this.#onChangeScale();
    }
  }

  #onChangeScale() {
    this._scale = this.#scaleRatio * this.#screenHeight / (this._visibleHeight * this.#serverScale);
    this.draw();
    this.#cells.forEach(cell => cell.setScale(this._scale));
  }

  play(playerId, x, y, maxMass) {
    this.init();
    this.#leaderboard.playerId = playerId;
    this.#playerInfoPanel.maxMass = maxMass;
    this._player = new Player(playerId, x, y);
  };

  modifyCell(def) {
    /** @type {Cell} */
    let cell = this.#cells.get(def.id);
    if (cell) {
      cell.modify(def);
    } else {
      if (def.isFood()) {
        cell = new Food(this, def, this._scale);
      } else if (def.isMass()) {
        cell = new Mass(this, def, this._scale);
      } else if (def.isAvatar()) {
        cell = new Avatar(this, def, this._scale);
        if (this.#onCreateAvatar) {
          this.#onCreateAvatar(cell);
        }
      } else if (def.isVirus()) {
        cell = new Virus(this, def, this._scale);
      } else if (def.isMother()) {
        cell = new Mother(this, def, this._scale);
      } else {
        cell = new Cell(this, def, this._scale);
      }
      this.#cells.set(cell.id, cell);
      if (def.isFood()) {
        this.#foodLayer.addChild(cell);
      } else {
        this.#cellsLayer.addChild(cell);
        if (cell.playerId === this._player.id) {
          this._player.addAvatar(cell);
        }
      }
      cell.draw();
    }

    if (cell.isSimulated()) {
      this.#simulatedCells.add(cell);
    }
    if (cell.isAnimated()) {
      this.#animatedCells.add(cell);
    }

    // TODO: Optimize. Must sort array of children only one time at the end of addition
    if (!def.isFood()) {
      this.#cellsLayer.children.sort((a, b) => a.mass - b.mass);
    }
  }

  removeCell(cellId) {
    let cell = this.#cells.get(cellId);
    if (cell) {
      this.#simulatedCells.delete(cell);
      this.#animatedCells.delete(cell);
      if (cell.playerId === this._player.id) {
        this._player.removeAvatar(cell);
      }
      cell.parent.removeChild(cell); // TODO: encapsulate logic
      this.#cells.delete(cellId);
    }
  }
}