import * as PIXI from 'pixi.js';
import BinaryStream from './BinaryStream.js';
import { PlayerInfo } from './Player.js';
import Room from './Room.js';
import { CellDef } from "./Cell.js";

export default class Game extends PIXI.Application {
  #config;
  /** @type {Number} */
  #screenWidth;
  /** @type {Number} */
  #screenHeight;
  /** @type {Number} */
  #scaleModifier = 100;
  /** @type {Room} */
  #room = null;
  /** @type {WebSocket} */
  #socket = null;
  /** @type {Boolean} */
  #ready = false;
  #players = {};
  /** @type {PIXI.Point} */
  #mousePosition = new PIXI.Point();
  /** @type {Boolean} */
  #mousePositionChanged = false;
  /** @type {Number} */
  #packetsIn = 0;
  /** @type {Number} */
  #packetsOut = 0;
  /** @type {Number} */
  #bytesIn = 0;
  /** @type {Number} */
  #bytesOut = 0;
  /** @type {Boolean} */
  #stopped = false;
  /** @type {Boolean} */
  #isSpectateMode = false;
  /** @type {Number} */
  #lastPingTime;
  /** @type {Number} */
  #infoPanelLastUpdate = Date.now();

  #onConnectionLoss = null;
  #onPlay = null;
  #onSpectate = null;
  #onFinish = null;

  #dispatcher = {
    1: stream => this.onPacketPong(stream),
    2: stream => this.onPacketGreeting(stream),
    3: stream => this.onPacketRoom(stream),
    4: stream => this.onPacketFrame(stream),
    5: stream => this.onPacketLeaderboard(stream),
    6: stream => this.onPacketPlayer(stream),
    7: stream => this.onPacketPlayerRemove(stream),
    8: stream => this.onPacketPlayerJoin(stream),
    9: stream => this.onPacketPlayerLeave(stream),
    10: stream => this.onPacketPlayerBorn(stream),
    11: stream => this.onPacketPlayerDead(stream),
    12: stream => this.onPacketPlay(stream),
    13: stream => this.onPacketSpectate(stream),
    14: stream => this.onPacketFinish(stream),
    15: stream => this.onPacketChatMessage(stream)
  };

  constructor(config) {
    super();

    this.#config = config;

    this.#room = new Room(this.stage, config);
    this.#room.onCreateAvatar = avatar => {
      const origHandler = avatar.onmousedown;
      avatar.onmousedown = event => {
        if (origHandler) {
          origHandler(event);
        }
        this.#chooseTargetPlayer(event);
      }
    };
    this.#room.leaderboard.onMouseDown = event => this.#chooseTargetPlayer(event);

    window.addEventListener('keydown', (event) => {
      if (event.repeat) {
        return;
      }
      const code = event.code;
      if (code === 'ControlLeft' || code === 'AltLeft') {
        this.sendPacketPointer(0, 0);
        this.#stopped = true;
        this.#room._pointerX = 0; // TODO: avoid using protected members from this.#room
        this.#room._pointerY = 0; // TODO: avoid using protected members from this.#room
      }
    });
    window.addEventListener('keyup', (event) => {
      const code = event.code;
      if (code === 'ControlLeft' || code === 'AltLeft') {
        this.#stopped = false;
        this.#mousePositionChanged = true;
      }
    });
  }

  get room() {
    return this.#room;
  }

  set onConnectionLoss(handler) {
    this.#onConnectionLoss = handler;
  }

  set onPlay(handler) {
    this.#onPlay = handler;
  }

  set onSpectate(handler) {
    this.#onSpectate = handler;
  }

  set onFinish(handler) {
    this.#onFinish = handler;
  }

  #chooseTargetPlayer(event) {
    if (this.#isSpectateMode) {
      this.actionSpectate(event.target.playerId);
    } else {
      this.actionWatch(event.target.playerId);
    }
    event.stopPropagation();
  }

  setScreenSize(width, height) {
    this.#screenWidth = width;
    this.#screenHeight = height;
    this.#room.setScreenSize(width, height);
  }

  /**
   * @param {ArrayBuffer} buffer
   */
  #send(buffer) {
    this.#socket.send(buffer);
    ++this.#packetsOut;
    this.#bytesOut += buffer.byteLength;
  }

  update() {
    // TODO: use external time counter
    const now = Date.now();
    const dt = now - this.#infoPanelLastUpdate;
    if (dt > 250) {
      let k = 1000 / dt;
      this.#room.infoPanel.packetsIn = this.#packetsIn * k;
      this.#room.infoPanel.packetsOut = this.#packetsOut * k;
      this.#room.infoPanel.bytesIn = this.#bytesIn * k;
      this.#room.infoPanel.bytesOut = this.#bytesOut * k;
      this.#packetsIn = 0;
      this.#packetsOut = 0;
      this.#bytesIn = 0;
      this.#bytesOut = 0;
      this.#infoPanelLastUpdate = now;
    }
    if (this.#ready) {
      if (!this.#stopped && !this.#isSpectateMode) {
        if (this.#mousePositionChanged) {
          const x = (this.#mousePosition.x - 0.5 * this.#screenWidth) / this.#room._scale4rename; // TODO: avoid using protected members
          const y = (this.#mousePosition.y - 0.5 * this.#screenHeight) / this.#room._scale4rename; // TODO: avoid using protected members
          this.sendPacketPointer(x, y);
          // TODO: revise
          this.#room._pointerX = x; // TODO: avoid using protected members
          this.#room._pointerY = y; // TODO: avoid using protected members
          this.#mousePositionChanged = false;
        }
      }
      this.#room.update();
    }
  }

  sendPing() {
    const stream = new BinaryStream();
    stream.writeUInt8(1);
    this.#send(stream.buffer);
  }

  /**
   * @param {string} sid
   */
  sendGreeting(sid) {
    const stream = new BinaryStream(35);
    stream.writeUInt8(3);
    stream.writeString(sid ? sid : '');
    this.#send(stream.buffer);
  }

  /**
   * @param {string} name
   * @param {number} color
   */
  actionPlay(name, color) {
    const stream = new BinaryStream(64);
    stream.writeUInt8(4);
    stream.writeString(name);
    stream.writeUInt8(color);
    this.#send(stream.buffer);
  }

  sendPacketPointer(x, y) {
    const stream = new BinaryStream(5);
    stream.writeUInt8(5);
    stream.writeUInt16(x);
    stream.writeUInt16(y);
    this.#send(stream.buffer);
  }

  /**
   * @param {number} playerId
   */
  actionSpectate(playerId) {
    const stream = new BinaryStream(5);
    stream.writeUInt8(8);
    stream.writeUInt32(playerId);
    this.#send(stream.buffer);
  }

  /**
   * @param {number} playerId
   */
  actionWatch(playerId) {
    const stream = new BinaryStream(5);
    stream.writeUInt8(10);
    stream.writeUInt32(playerId);
    this.#send(stream.buffer);
  }

  // TODO: avoid using protected members from this.#room
  #getTargetPoint() {
    return new PIXI.Point(
      this.#room._player.x + (this.#mousePosition.x - 0.5 * this.#screenWidth) / this.#room._scale4rename,
      this.#room._player.y + (this.#mousePosition.y - 0.5 * this.#screenHeight) / this.#room._scale4rename
    );
  }

  actionEject() {
    if (this.#ready) {
      const point = this.#getTargetPoint();
      const stream = new BinaryStream(5);
      stream.writeUInt8(6);
      stream.writeUInt16(point.x);
      stream.writeUInt16(point.y);
      this.#send(stream.buffer);
    }
  }

  actionSplit() {
    if (this.#ready) {
      const point = this.#getTargetPoint();
      const stream = new BinaryStream(5);
      stream.writeUInt8(7);
      stream.writeUInt16(point.x);
      stream.writeUInt16(point.y);
      this.#send(stream.buffer);
    }
  }

  /**
   * @param {string} text
   */
  chatMessage(text) {
    if (this.#ready) {
      const stream = new BinaryStream(1024);
      stream.writeUInt8(2);
      stream.writeString(text);
      this.#send(stream.buffer);
    }
  }

  /**
   * @param {PIXI.Point} point
   */
  setMousePosition(point) {
    if (!point.equals(this.#mousePosition)) {
      this.#mousePosition.set(point.x, point.y);
      this.#mousePositionChanged = true;
    }
  }

  /**
   * @param {string} url
   */
  startConnection(url) {
    this.#socket = new WebSocket(url);
    this.#socket.binaryType = 'arraybuffer';
    this.#socket.onopen = () => {
      const checkReadyState = () => {
        if (this.#socket.readyState === 0) {
          setTimeout(checkReadyState, 50);
          return;
        }
        this.sendGreeting(localStorage.getItem('sid'));
        this.ping();
      }
      checkReadyState();
    };
    this.#socket.onclose = () => {
      if (this.#onConnectionLoss) {
        this.#onConnectionLoss();
      }
      this.#socket = null;
      this.#ready = false;
      this.#room.init();
    };
    this.#socket.onmessage = event => {
      const stream = new BinaryStream(event.data);
      this.#bytesIn += stream.byteLength;
      while (stream.hasNext()) {
        const type = stream.readUInt8();
        if (this.#dispatcher.hasOwnProperty(type)) {
          this.#dispatcher[type](stream);
        }
        ++this.#packetsIn;
      }
    }
  }

  incScale() {
    if (this.#scaleModifier < 200) {
      this.#scaleModifier += 10;
      this.#room.setScaleRatio(0.01 * this.#scaleModifier);
    }
  }

  decScale() {
    if (this.#scaleModifier > 10) {
      this.#scaleModifier -= 10;
      this.#room.setScaleRatio(0.01 * this.#scaleModifier);
    }
  }

  resetScale() {
    if (this.#scaleModifier !== 100) {
      this.#scaleModifier = 100;
      this.#room.setScaleRatio(0.01 * this.#scaleModifier);
    }
  }

  ping() {
    if (this.#socket) {
      this.sendPing();
      this.#lastPingTime = Date.now();
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPong(stream) {
    const now = Date.now();
    this.#room.infoPanel.ping = (now - this.#lastPingTime) >> 0;
    this.#lastPingTime = now;
    setTimeout(() => this.ping(), 2500);
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketGreeting(stream) {
    const sid = stream.readString();
    if (sid) {
      localStorage.setItem('sid', sid);
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketRoom(stream) {
    const width = stream.readUInt16();
    const height = stream.readUInt16();
    const viewportBase = stream.readUInt16();
    const viewportBuffer = stream.readFloat();
    const aspectRatio = stream.readFloat();
    const resistanceRatio = stream.readFloat();
    const elasticityRatio = stream.readFloat(); // TODO: this field does not used, remove from the protocol
    const foodResistanceRatio = stream.readFloat();
    let count = stream.readUInt8();
    for (; count > 0; --count) {
      const id = stream.readUInt32();
      const name = stream.readString();
      const status = stream.readUInt8();
      this.#players[id] = new PlayerInfo(id, name, status);
    }
    // $rootScope['chatHistory'] = []; // TODO: implement
    count = stream.readUInt8();
    for (; count > 0; --count) {
      const authorId = stream.readUInt32();
      const author = stream.readString();
      const text = stream.readString();
      // $rootScope['chatHistory'].push({'authorId': authorId, 'author': author, 'text': text}); // TODO: implement
      // $rootScope.$apply(); // TODO: implement
    }
    this.#room.init();
    // TODO: avoid using protected members
    // TODO: implement the following block
    this.#room._originalWidth = width;
    this.#room._originalHeight = height;
    this.#room._visibleHeight = viewportBase;
    this.#room._visibleWidth = viewportBase * aspectRatio;
    this.#room._viewportBuffer = viewportBuffer;
    this.#room._resistanceRatio = resistanceRatio;
    this.#room._foodResistanceRatio = foodResistanceRatio;
    this.#room.setScreenSize(this.#screenWidth, this.#screenHeight); // TODO: fix
    this.#ready = true;
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketFrame(stream) {
    const now = Date.now();
    const scale = stream.readFloat();
    const cellDefs = [];
    let cnt = stream.readUInt16();
    for (; cnt > 0; --cnt) {
      const def = new CellDef();
      cellDefs.push(def);
      def.type = stream.readUInt8();
      def.id = stream.readUInt32();
      def.x = stream.readFloat();
      def.y = stream.readFloat();
      def.mass = stream.readUInt32();
      def.radius = stream.readUInt16();
      def.color = stream.readUInt8();
      if (def.isAvatar()) {
        def.playerId = stream.readUInt32();
        def.name = this.#players[def.playerId].name;
      }
      if (def.isMoving()) {
        def.vx = stream.readFloat();
        def.vy = stream.readFloat();
      }
      def.color = this.#config.colors[def.color];
    }

    const removed = [];
    cnt = stream.readUInt16();
    for (; cnt > 0; --cnt) {
      removed.push(stream.readUInt32());
    }

    const selfAvatarsInfo = [];
    cnt = stream.readUInt8();
    for (; cnt > 0; --cnt) {
      const id = stream.readUInt32();
      const maxSpeed = stream.readFloat();
      selfAvatarsInfo.push({id: id, maxSpeed: maxSpeed});
    }

    this.#room.frame(now, scale, cellDefs, removed, selfAvatarsInfo);
    const arrowPlayerId = stream.readUInt32();
    if (arrowPlayerId) {
      // TODO: avoid using protected members from this.#room
      this.#room._arrowPlayerX = stream.readFloat();
      this.#room._arrowPlayerY = stream.readFloat();
      this.#room.directionPanel.playerInfo = this.#players[arrowPlayerId];
      this.#room.directionPanel.visible = true;
    } else {
      this.#room.directionPanel.playerInfo = null;
      this.#room.directionPanel.visible = false;
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketLeaderboard(stream) {
    const items = [];
    let count = stream.readUInt8();
    for (; count > 0; --count) {
      const id = stream.readUInt32();
      const mass = stream.readUInt32();
      items.push({'id': id, 'name': this.#players[id].name, 'mass': mass});
    }
    this.#room.leaderboard.items = items;
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayer(stream) {
    const playerId = stream.readUInt32();
    const name = stream.readString();
    if (this.#players.hasOwnProperty(playerId)) {
      this.#players[playerId].name = name;
    } else {
      this.#players[playerId] = new PlayerInfo(playerId, name, 3);
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerRemove(stream) {
    const playerId = stream.readUInt32();
    delete this.#players[playerId];
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerJoin(stream) {
    // TODO: after reconnect this packet is received before this.#players[playerId] is created
    const playerId = stream.readUInt32();
    //this.#players[playerId].status |= 1; // TODO: avoid magic numbers
    this.#room.directionPanel.update();
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerLeave(stream) {
    const playerId = stream.readUInt32();
    this.#players[playerId].status &= 0xFE; // TODO: avoid magic numbers
    this.#room.directionPanel.update();
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerBorn(stream) {
    const playerId = stream.readUInt32();
    this.#players[playerId].status |= 2; // TODO: avoid magic numbers
    this.#room.directionPanel.update();
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerDead(stream) {
    const playerId = stream.readUInt32();
    this.#players[playerId].status &= 0xFD; // TODO: avoid magic numbers
    this.#room.directionPanel.update();
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketFinish(stream) {
    if (this.#onFinish) {
      this.#onFinish();
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlay(stream) {
    const playerId = stream.readUInt32();
    const x = stream.readUInt16();
    const y = stream.readUInt16();
    const maxMass = stream.readUInt32();
    this.#room.play(playerId, x, y, maxMass);
    this.#isSpectateMode = false;
    if (this.#onPlay) {
      this.#onPlay();
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketSpectate(stream) {
    const playerId = stream.readUInt32();
    const x = stream.readUInt16();
    const y = stream.readUInt16();
    const maxMass = stream.readUInt32();
    this.#room.play(playerId, x, y, maxMass);
    this.#isSpectateMode = true;
    if (this.#onSpectate) {
      this.#onSpectate();
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketChatMessage(stream) {
    const authorId = stream.readUInt32();
    const text = stream.readString();
    const msg = {
      'authorId': authorId,
      'author': this.#players.hasOwnProperty(authorId) ? this.#players[authorId].name : '',
      'text': text
    };
    // TODO: implement
    // $rootScope['chatMessages'].push(msg);
    // $rootScope['chatHistory'].unshift(msg);
    // $rootScope.$apply();
  }

  getPlayers() {
    let arr = {};
    // TODO: simplify iterating
    for (let id in this.#players) {
      const info = this.#players[id];
      arr[id] = info.name;
    }
    return arr;
  }
}
