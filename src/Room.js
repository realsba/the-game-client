import * as PIXI from 'pixi.js';
import PlayerInfoPanel from './PlayerInfoPanel.js';
import Leaderboard from './Leaderboard.js';
import InfoPanel from './InfoPanel.js';
import DirectionPanel from './DirectionPanel.js';
import Player from './Player.js';
import { Cell, Avatar, Food, Mass, Virus, Mother } from './Cell.js';
import Vec2D from './Vec2D.js';

export default class Room extends PIXI.Container {
  _visibleWidth = 1320; // TODO: make private
  _visibleHeight = 743; // TODO: make private
  #screenWidth = 640;
  #screenHeight = 480;

  _originalWidth;      // TODO: make private
  _originalHeight;     // TODO: make private
  _viewportBuffer;     // TODO: make private

  #serverScale = 1;
  #scaleRatio = 1;
  _scale4rename = 1; // TODO: rename

  #simulatedCells = new Set();
  #animatedCells = new Set();

  #cells = new Map();
  _player = new Player(); // TODO: make private

  #gridLayer = this.addChild(new PIXI.Graphics());
  #borderLayer = this.addChild(new PIXI.Graphics());
  #layers = this.addChild(new PIXI.Container());
  #foodLayer = this.#layers.addChild(new PIXI.Container());
  #cellsLayer = this.#layers.addChild(new PIXI.Container());
  #debugLayer = this.addChild(new PIXI.Graphics());

  // TODO: implement
  #textLeftTop = /*this.#debugLayer.addChild(*/
    new PIXI.Text({style: {fontFamily: 'Arial', fontSize: '12pt', fill: 0xff1010, align: 'center'}})
  /*)*/;
  #textRightBottom = /*this.#debugLayer.addChild(*/
    new PIXI.Text({style: {fontFamily: 'Arial', fontSize: '12pt', fill : 0xff1010, align : 'center'}})
  /*)*/;
  #rightBottomX = 0;

  /** @type {Leaderboard} */
  #leaderboard;
  /** @type {PlayerInfoPanel} */
  #playerInfoPanel;
  /** @type {InfoPanel} */
  #infoPanel;
  /** @type {DirectionPanel} */
  #directionPanel;

  _pointerX; // TODO: make private
  _pointerY; // TODO: make private

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

  set targetPlayer(playerInfo) {
    if (playerInfo) {
      this.#directionPanel.playerInfo = playerInfo;
      this.#directionPanel.visible = true;
    } else {
      this.#directionPanel.playerInfo = null;
      this.#directionPanel.visible = false;
    }
  }

  set directionToTargetPlayer(angle) {
    if (this.#directionPanel.visible) {
      this.#directionPanel.setAngle(angle);
    }
  }

  init() {
    this.frame = this.#initFrame;
    this.update = () => {};
    this.lastUpdate = Date.now() + 1000;
    this.#cells.clear();
    this.#simulatedCells.clear();
    this.#animatedCells.clear();
    this._player.clearAvatars();
    this.#foodLayer.removeChildren();
    this.#cellsLayer.removeChildren();
  }

  #draw() {
    this.#drawBorder();
    this.#drawGrid();
    this.#drawDebugLayer();
  }

  #drawBorder() {
    this.#borderLayer.clear();
    this.#borderLayer.rect(0, 0, this._originalWidth * this._scale4rename, this._originalHeight * this._scale4rename);
    this.#borderLayer.stroke(this._config.borderLineStyle);
  }

  #drawGrid() {
    this.#gridLayer.clear();
    const gridSize = this._config.gridSize * this._scale4rename;
    for (let i = 0; i <= this.#screenWidth + gridSize; i += gridSize) {
      this.#gridLayer.moveTo(i, -gridSize);
      this.#gridLayer.lineTo(i, this.#screenHeight + gridSize);
    }
    for (let i = 0; i <= this.#screenHeight + gridSize; i += gridSize) {
      this.#gridLayer.moveTo(-gridSize, i);
      this.#gridLayer.lineTo(this.#screenWidth + gridSize, i);
    }
    this.#gridLayer.stroke(this._config.gridLineStyle);
  }

  #drawDebugLayer() {
    this.#debugLayer.clear();
    if (this.#scaleRatio < 1) {
      let width = this._visibleWidth * this.#serverScale * this._scale4rename;
      let height = this._visibleHeight * this.#serverScale * this._scale4rename;
      let left = 0.5 * (this.#screenWidth - width);
      let top = 0.5 * (this.#screenHeight - height);
      this.#debugLayer.rect(left, top, width, height);
      this.#debugLayer.stroke({color: 0x0000FF, alpha: 0.75});

      const k = 1 + 2 * this._viewportBuffer;
      width *= k;
      height *= k;
      left = 0.5 * (this.#screenWidth - width);
      top = 0.5 * (this.#screenHeight - height);
      const right = 0.5 * (this.#screenWidth + width);
      const bottom = 0.5 * (this.#screenHeight + height);
      this.#debugLayer.rect(left, top, width, height);
      this.#debugLayer.stroke({color: 0x00FF00, alpha: 0.75});

      this.#textLeftTop.position.set(left, top);
      this.#textRightBottom.position.set(right - 120, bottom - this.#textRightBottom.height);
      this.#rightBottomX = right;

      this.#debugLayer.circle(0.5 * this.#screenWidth, 0.5 * this.#screenHeight, 10 * this._scale4rename);
      this.#debugLayer.fill({color: 0x0000FF, alpha: 0.85});
    }
  }

  #initFrame(now, serverScale, cellDefs) {
    this.frame = this.#frame;
    this.update = this.#update;
    this.lastUpdate = now;
    this.#setServerScale(serverScale);
    cellDefs.forEach(def => this.#modifyCell(def));
  };

  #frame(now, serverScale, cellDefs, removed, selfAvatarsInfo) {
    this.#setServerScale(serverScale);
    removed.forEach(id => this.removeCell(id));
    cellDefs.forEach(def => this.#modifyCell(def));
    selfAvatarsInfo.forEach(item => {
      /** @type {Avatar} */
      const avatar = this.#cells.get(item.id);
      if (avatar) {
        avatar._maxSpeed = item.maxSpeed; // TODO: avoid using protected members
      }
    });
  };

  #update() {
    let now = Date.now();
    let dt = now - this.lastUpdate;
    this.lastUpdate = now;
    dt *= 0.001;

    const pointerForceRatio = 2.5;
    // TODO: avoid using protected members from this._player
    this._player._avatars.forEach(avatar => {
      let velocity = new Vec2D((this._player.x + this._pointerX - avatar._position.x), (this._player.y + this._pointerY - avatar._position.y));
      const dist = velocity.length();
      const k = dist < avatar._radius ? dist / avatar._radius : 1;
      velocity = velocity.direction().scalarProduct(k * avatar._maxSpeed);
      const force = new Vec2D(
        (velocity.x - avatar._velocity.x) * avatar._mass * pointerForceRatio,
        (velocity.y - avatar._velocity.y) * avatar._mass * pointerForceRatio
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

    const x = 0.5 * this.#screenWidth - this._player.x * this._scale4rename;
    const y = 0.5 * this.#screenHeight - this._player.y * this._scale4rename;
    this.#layers.position.set(x, y);
    this.#borderLayer.position.set(x, y);
    const gridSize = this._config.gridSize * this._scale4rename;
    this.#gridLayer.position.set(x % gridSize, y % gridSize);
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
    const scale = this.#scaleRatio * this.#screenHeight / (this._visibleHeight * this.#serverScale);
    this._scale4rename = scale;
    this.#layers.scale.set(scale, scale);
    this.#draw();
  }

  play(playerId, x, y, maxMass) {
    this.init();
    this.#leaderboard.playerId = playerId;
    this.#playerInfoPanel.maxMass = maxMass;
    this._player = new Player(playerId, x, y);
  };

  #modifyCell(def) {
    /** @type {Cell} */
    let cell = this.#cells.get(def.id);
    if (cell) {
      cell.modify(def);
    } else {
      if (def.isFood()) {
        cell = new Food(this, def);
      } else if (def.isMass()) {
        cell = new Mass(this, def);
      } else if (def.isAvatar()) {
        cell = new Avatar(this, def);
        if (this.#onCreateAvatar) {
          this.#onCreateAvatar(cell);
        }
      } else if (def.isVirus()) {
        cell = new Virus(this, def);
      } else if (def.isMother()) {
        cell = new Mother(this, def);
      } else {
        cell = new Cell(this, def);
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