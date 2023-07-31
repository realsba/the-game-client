import { Application } from 'pixi.js';
import BinaryStream from './BinaryStream.js';
import { PlayerInfo } from './Player.js';
import Room from './Room.js';
import { CellDef } from "./Cell.js";

export default class Game extends Application {
  _screenWidth;
  _screenHeight;
  _scaleModifier = 100;
  /** @type {Room} */
  _room = null;
  /** @type {WebSocket} */
  _socket = null;
  _ready = false;
  _players = {};
  _mousePosition = {};
  _mousePositionChanged = false;
  _packetsIn = 0;
  _packetsOut = 0;
  _bytesIn = 0;
  _bytesOut = 0;
  _stopped = false;
  _isSpectateMode = false;
  _lastPingTime;
  _infoPanelLastUpdate = Date.now();

  _dispatcher = {
    1: (stream) => this.onPacketPong(stream),
    2: (stream) => this.onPacketGreeting(stream),
    3: (stream) => this.onPacketRoom(stream),
    4: (stream) => this.onPacketFrame(stream),
    5: (stream) => this.onPacketLeaderboard(stream),
    6: (stream) => this.onPacketPlayer(stream),
    7: (stream) => this.onPacketPlayerRemove(stream),
    8: (stream) => this.onPacketPlayerJoin(stream),
    9: (stream) => this.onPacketPlayerLeave(stream),
    10: (stream) => this.onPacketPlayerBorn(stream),
    11: (stream) => this.onPacketPlayerDead(stream),
    12: (stream) => this.onPacketPlay(stream),
    13: (stream) => this.onPacketSpectate(stream),
    14: (stream) => this.onPacketFinish(stream),
    15: (stream) => this.onPacketChatMessage(stream)
  };

  constructor(options, config) {
    super(options);
    this._config = config;
    this._room = new Room(this.stage, config);
    // TODO: implement
    //let stopSprite = new PIXI.Sprite.fromImage('img/stop.png');
    //stopSprite.visible = false;
  }

  setScreenSize(width, height) {
    this._screenWidth = width;
    this._screenHeight = height;
    this._room.setScreenSize(width, height);
    // TODO: implement
    // infoPanel.onResize();
    // stopSprite.x = this._screenWidth - 128; // TODO: change -128 to -stopSprite.width
    // stopSprite.y = infoPanel.y + infoPanel.height;
  }

  /**
   * @param {ArrayBuffer} buffer
   */
  send(buffer) {
    this._socket.send(buffer);
    ++this._packetsOut;
    this._bytesOut += buffer.byteLength;
  }

  update() {
    // TODO: use external time counter
    const now = Date.now();
    const dt = now - this._infoPanelLastUpdate;
    if (dt > 250) {
      let k = 1000 / dt;
      this._room.infoPanel.packetsIn = this._packetsIn * k;
      this._room.infoPanel.packetsOut = this._packetsOut * k;
      this._room.infoPanel.bytesIn = this._bytesIn * k;
      this._room.infoPanel.bytesOut = this._bytesOut * k;
      this._packetsIn = 0;
      this._packetsOut = 0;
      this._bytesIn = 0;
      this._bytesOut = 0;
      this._infoPanelLastUpdate = now;
    }
    if (this._ready) {
      if (this._mousePositionChanged) {
        const x = this._stopped || this._isSpectateMode ? 0 : (this._mousePosition.x - 0.5 * this._screenWidth) / this._room._scale; // TODO: avoid using protected members
        const y = this._stopped || this._isSpectateMode ? 0 : (this._mousePosition.y - 0.5 * this._screenHeight) / this._room._scale; // TODO: avoid using protected members
        const stream = new BinaryStream(5);
        stream.writeUInt8(5);
        stream.writeUInt16(x);
        stream.writeUInt16(y);
        this.send(stream.buffer);
        this._mousePositionChanged = false;
        this._room._pointerX = x; // TODO: avoid using protected members
        this._room._pointerY = y; // TODO: avoid using protected members
      }
      // this._room.$update(); // TODO: implement
    }
  }

  /**
   * @param {string} sid
   */
  sendGreeting(sid) {
    const stream = new BinaryStream(35);
    stream.writeUInt8(3);
    stream.writeString(sid ? sid : '');
    this.send(stream.buffer);
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
    this.send(stream.buffer);
  }

  /**
   * @param {number} playerId
   */
  actionSpectate(playerId) {
    const stream = new BinaryStream(5);
    stream.writeUInt8(8);
    stream.writeUInt32(playerId);
    this.send(stream.buffer);
  }

  actionEject(point) {
    if (this._ready) {
      const stream = new BinaryStream(5);
      stream.writeUInt8(6);
      stream.writeUInt16(room._player._x + (point.x - 0.5 * this._screenWidth) / room._scale);  // TODO: fix
      stream.writeUInt16(room._player._y + (point.y - 0.5 * this._screenHeight) / room._scale); // TODO: fix
      this.send(stream.buffer);
    }
  }

  actionSplit(point) {
    if (this._ready) { // TODO: fix
      const stream = new BinaryStream(5);
      stream.writeUInt8(7);
      stream.writeUInt16(room._player._x + (point.x - 0.5 * this._screenWidth) / room._scale);  // TODO: fix
      stream.writeUInt16(room._player._y + (point.y - 0.5 * this._screenHeight) / room._scale); // TODO: fix
      this.send(stream.buffer);
    }
  }

  /**
   * @param {string} text
   */
  chatMessage(text) {
    if (this._ready) {
      const stream = new BinaryStream(1024);
      stream.writeUInt8(2);
      stream.writeString(text);
      this.send(stream.buffer);
    }
  }

  // TODO: implement if needed
  // stop(value) {
  //   stopSprite.visible = value;
  // }

  // TODO: fix
  setMousePosition(point) {
    if (point === false || point === true) {
      if (stopped !== point) {
        this._stopped = point;
        this._mousePositionChanged = true;
      }
      return;
    }
    if (this._mousePosition.x !== point.x || this._mousePosition.y !== point.y) {
      this._mousePosition.x = point.x;
      this._mousePosition.y = point.y;
      this._mousePositionChanged = true;
    }
  }

  /**
   * @param {string} url
   */
  startConnection(url) {
    this._socket = new WebSocket(url);
    this._socket.binaryType = 'arraybuffer';
    this._socket.onopen = () => {
      const checkReadyState = () => {
        if (this._socket.readyState === 0) {
          setTimeout(checkReadyState, 50);
          return;
        }
        this.sendGreeting(localStorage.getItem('sid'));
        this.ping();
      }
      checkReadyState();
    };
    this._socket.onclose = () => {
      // TODO: implement
      // if (service.onConnectionLoss) {
      //   service.onConnectionLoss();
      // }
      this._socket = null;
      this._ready = false;
      this._room.init();
    };
    this._socket.onmessage = (event) => {
      const stream = new BinaryStream(event.data);
      this._bytesIn += stream.byteLength;
      while (stream.hasNext()) {
        const type = stream.readUInt8();
        if (this._dispatcher.hasOwnProperty(type)) {
          this._dispatcher[type](stream);
        }
        ++this._packetsIn;
      }
    }
  }

  incScale() {
    if (this._scaleModifier < 200) {
      this._scaleModifier += 10;
      this._room.setScaleRatio(0.01 * this._scaleModifier);
    }
  }

  decScale() {
    if (this._scaleModifier > 10) {
      this._scaleModifier -= 10;
      this._room.setScaleRatio(0.01 * this._scaleModifier);
    }
  }

  resetScale() {
    if (this._scaleModifier !== 100) {
      this._scaleModifier = 100;
      this._room.setScaleRatio(0.01 * this._scaleModifier);
    }
  }

  ping() {
    if (this._socket) {
      const stream = new BinaryStream();
      stream.writeUInt8(1);
      this.send(stream.buffer);
      this._lastPingTime = Date.now();
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPong(stream) {
    const now = Date.now();
    this._room.infoPanel.ping = (now - this._lastPingTime) >> 0;
    this._lastPingTime = now;
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
    // TODO: remove the following temporary code
    this.actionPlay('sba', 2);
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
    const elasticityRatio = stream.readFloat();
    const foodResistanceRatio = stream.readFloat();
    let count = stream.readUInt8();
    for (; count > 0; --count) {
      const id = stream.readUInt32();
      const name = stream.readString();
      const status = stream.readUInt8();
      this._players[id] = new PlayerInfo(id, name, status);
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
    this._room.init();
    // TODO: avoid using protected members
    // TODO: implement the following block
    this._room.socket = this._socket;
    this._room._width = width; // TODO: use originalWidth
    this._room._height = height; // TODO: use originalHeight
    this._room._visibleHeight = viewportBase;
    this._room._visibleWidth = viewportBase * aspectRatio;
    this._room._viewportBuffer = viewportBuffer;
    this._room._resistanceRatio = resistanceRatio;
    this._room._elasticityRatio = elasticityRatio; // TODO: not used
    this._room._foodResistanceRatio = foodResistanceRatio;
    this._room._player._x = 0.5 * width;
    this._room._player._y = 0.5 * height;
    this._room.setScreenSize(this._screenWidth, this._screenHeight); // TODO: fix
    this._ready = true;
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketFrame(stream) {
    const now = Date.now();
    const tick = stream.readUInt32();
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
        def.name = this._players[def.playerId].name;
        // def._protection = stream.readUInt32();
      }
      if (def.isMoving()) {
        def.vx = stream.readFloat();
        def.vy = stream.readFloat();
      }
      def.color = this._config.colors[def.color];
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
      const protection = stream.readUInt32();
      selfAvatarsInfo.push({id: id, maxSpeed: maxSpeed, protection: protection});
    }

    this._room.frame(now, tick, scale, cellDefs, removed, selfAvatarsInfo); // TODO: fix
    const arrowPlayerId = stream.readUInt32();
    if (arrowPlayerId !== this._room._arrowPlayerId) {
      if (arrowPlayerId) {
        this._room._arrowPlayerX = stream.readFloat();
        this._room._arrowPlayerY = stream.readFloat();
        // TODO: fix
        // if (this._room._directionPanel._player !== players[arrowPlayerId]) {
        //   this._room._directionPanel._label.text = players[arrowPlayerId]._name;
        //   this._room._directionPanel._player = players[arrowPlayerId];
        //   this._room._directionPanel.update();
        // }
        // this._room._directionPanel.visible = true; // TODO: fix
      } else {
        // this._room._directionPanel.visible = false; // TODO: fix
      }
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketLeaderboard(stream) {
    const items = [];
    let count = stream.readUInt8();
    for (; count>0; --count) {
      const id = stream.readUInt32();
      const mass = stream.readUInt32();
      items.push({'id': id, 'name': this._players[id].name, 'mass': mass});
    }
    // TODO: avoid using protected members
    this._room._leaderboard.items = items;
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayer(stream) {
    const playerId = stream.readUInt32();
    const name = stream.readString();
    if (this._players.hasOwnProperty(playerId)) {
      this._players[playerId].name = name;
    } else {
      this._players[playerId] = new PlayerInfo(playerId, name, 3);
    }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerRemove(stream) {
    const playerId = stream.readUInt32();
    delete this._players[playerId];
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerJoin(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status |= 1;
    // this._room._directionPanel.update(); // TODO: fix
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerLeave(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status &= 0xFE; // TODO: avoid magic numbers
    // this._room._directionPanel.update(); // TODO: fix
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerBorn(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status |= 2; // TODO: avoid magic numbers
    // this._room._directionPanel.update(); // TODO: fix
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlayerDead(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId]._status &= 0xFD; // TODO: avoid magic numbers
    // this._room._directionPanel.update(); // TODO: fix
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketFinish(stream) {
    // TODO: implement
    // if (service.onFinish) {
    //   service.onFinish();
    // }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketPlay(stream) {
    const playerId = stream.readUInt32();
    const x = stream.readUInt16();
    const y = stream.readUInt16();
    const maxMass = stream.readUInt32();
    this._room.play(playerId, x, y, maxMass); // TODO: fix
    this._isSpectateMode = false;
    // TODO: implement
    // if (service.onPacketPlayer) {
    //   service.onPlay();
    // }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketSpectate(stream) {
    const playerId = stream.readUInt32();
    const x = stream.readUInt16();
    const y = stream.readUInt16();
    const maxMass = stream.readUInt32();
    this._room.play(playerId, x, y, maxMass);
    this._isSpectateMode = true;
    // TODO: implement
    // if (service.onSpectate) {
    //   service.onSpectate();
    // }
  }

  /**
   * @param {BinaryStream} stream
   */
  onPacketChatMessage(stream) {
    const authorId = stream.readUInt32();
    const text = stream.readString();
    const msg = {
      'authorId': authorId,
      'author': this._players.hasOwnProperty(authorId) ? this._players[authorId].name : '',
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
    for (let id in this._players) {
      const info = this._players[id];
      arr[id] = info.name;
    }
    return arr;
  }
}
