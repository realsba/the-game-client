import BinaryStream from './BinaryStream';
import {PlayerInfo} from './Player';
import Room from './Room';

export default class Game {
  _room = null;
  _socket = null;
  _ready = false;
  _players = {};
  _mousePosition = {};
  _mousePositionChanged = false;
  _frames = 0;
  _packetsIn = 0;
  _packetsOut = 0;
  _bytesIn = 0;
  _bytesOut = 0;
  _stopped = false;
  _isSpectateMode = false;
  _lastPingTime;

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

  constructor(view, config) {
    this._config = config;
    this._room = new Room(view, config);
    //let stopSprite = new PIXI.Sprite.fromImage('img/stop.png');
    //stopSprite.visible = false;
  }

  // resize(width, height) {
  //   screenWidth = width;
  //   screenHeight = height;
  //   room.setScreenSize(width, height);
  //   infoPanel.onResize();
  //   stopSprite.x = screenWidth - 128; // TODO: change -128 to -stopSprite.width
  //   stopSprite.y = infoPanel.y + infoPanel.height;
  // }

  send(buffer) {
    this._socket.send(buffer);
    ++this._packetsOut;
    this._bytesOut += buffer.byteLength;
  }

  // function update() {
  //   ++frames;
  //   let now = Date.now();
  //   let dt = now - infoPanelLastUpdate;
  //   if (dt > 250) {
  //     let k = 1000 / dt;
  //     infoPanel.fps = frames * k;
  //     infoPanel.packetsIn = packetsIn * k;
  //     infoPanel.packetsOut = packetsOut * k;
  //     infoPanel.bytesIn = bytesIn * k;
  //     infoPanel.bytesOut = bytesOut * k;
  //     frames = 0;
  //     packetsIn = 0;
  //     packetsOut = 0;
  //     bytesIn = 0;
  //     bytesOut = 0;
  //     infoPanelLastUpdate = now;
  //   }
  //   if (this._ready) {
  //     if (mousePositionChanged) {
  //       let x = stopped || this._isSpectateMode ? 0 : (mousePosition.x - 0.5 * screenWidth) / room._scale;
  //       let y = stopped || this._isSpectateMode ? 0 : (mousePosition.y - 0.5 * screenHeight) / room._scale;
  //       let binary = new jBinary(5);
  //       binary.writeUInt8(5);
  //       binary.writeUInt16(x);
  //       binary.writeUInt16(y);
  //       send(binary.view.buffer);
  //       mousePositionChanged = false;
  //       room._pointerX = x;
  //       room._pointerY = y;
  //     }
  //     room.$update();
  //   }
  // }

  sendGreeting(sid) {
    const stream = new BinaryStream(new ArrayBuffer(35));
    stream.writeUInt8(3);
    stream.writeString(sid ? sid : '');
    this.send(stream.buffer);
  }

  actionPlay(name, color) {
    const stream = new BinaryStream(64);
    stream.writeUInt8(4);
    stream.writeString(name);
    stream.writeUInt8(color);
    this.send(stream.buffer);
  }

  actionSpectate(playerId) {
    const stream = new BinaryStream(5);
    stream.writeUInt8(8);
    stream.writeUInt32(playerId);
    this.send(stream.buffer);
  }

  actionEject(point) {
    if (this._ready) { // TODO: fix
      const stream = new BinaryStream(5);
      stream.writeUInt8(6);
      stream.writeUInt16(room._player._x + (point.x - 0.5 * screenWidth) / room._scale);  // TODO: fix
      stream.writeUInt16(room._player._y + (point.y - 0.5 * screenHeight) / room._scale); // TODO: fix
      this.send(stream.buffer);
    }
  }

  actionSplit(point) {
    if (this._ready) { // TODO: fix
      const stream = new BinaryStream(5);
      stream.writeUInt8(7);
      stream.writeUInt16(room._player._x + (point.x - 0.5 * screenWidth) / room._scale);  // TODO: fix
      stream.writeUInt16(room._player._y + (point.y - 0.5 * screenHeight) / room._scale); // TODO: fix
      this.send(stream.buffer);
    }
  }

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
        stopped = point;
        mousePositionChanged = true;
      }
      return;
    }
    if (mousePosition.x !== point.x || mousePosition.y !== point.y) {
      mousePosition.x = point.x;
      mousePosition.y = point.y;
      mousePositionChanged = true;
    }
  }

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

  // function incScale() {
  //   if (scaleModifier < 200) {
  //     scaleModifier += 10;
  //     room.setScaleRatio(0.01 * scaleModifier);
  //   }
  // }

  // function decScale() {
  //   if (scaleModifier > 10) {
  //     scaleModifier -= 10;
  //     room.setScaleRatio(0.01 * scaleModifier);
  //   }
  // }

  // function resetScale() {
  //   if (scaleModifier != 100) {
  //     scaleModifier = 100;
  //     room.setScaleRatio(0.01 * scaleModifier);
  //   }
  // }

  ping() {
    if (this._socket) {
      let stream = new BinaryStream();
      stream.writeUInt8(1);
      this.send(stream.buffer);
      this._lastPingTime = Date.now();
    }
  }

  onPacketPong() {
    const now = Date.now();
    this._room.infoPanel.ping = (now - this._lastPingTime) >> 0;
    this._lastPingTime = now;
    setTimeout(() => this.ping(), 2500);
  }

  onPacketGreeting(stream) {
    const sid = stream.readString();
    if (sid) {
      localStorage.setItem('sid', sid);
    }
  }

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
    this._room._socket = socket;
    this._room._width = width;
    this._room._height = height;
    this._room._visibleHeight = viewportBase;
    this._room._visibleWidth = viewportBase * aspectRatio;
    this._room._viewportBuffer = viewportBuffer;
    this._room._resistanceRatio = resistanceRatio;
    this._room._elasticityRatio = elasticityRatio; // TODO: not used
    this._room._foodResistanceRatio = foodResistanceRatio;
    this._room._player._x = 0.5 * width;
    this._room._player._y = 0.5 * height;
    this._room.setScreenSize(screenWidth, screenHeight); // TODO: fix
    this._ready = true;
  }

  // /**
  //  * @param {BinaryStream} stream
  //  */
  // function onPacketFrame(stream) {
  //   let now = Date.now();
  //   let tick = stream.readUInt32();
  //   let scale = stream.readFloat();
  //   let cellDefs = [];
  //   let cnt = stream.readUInt16();
  //   for (; cnt>0; --cnt) {
  //     let def = new CellDef();
  //     cellDefs.push(def);
  //     def._type = stream.readUInt8();
  //     def._id = stream.readUInt32();
  //     def._x = stream.readFloat();
  //     def._y = stream.readFloat();
  //     def._mass = stream.readUInt32();
  //     def._radius = stream.readUInt16();
  //     def._color = stream.readUInt8();
  //     if (def.isAvatar()) {
  //       def._playerId = stream.readUInt32();
  //       def._name = players[def._playerId]._name;
  //       // def._protection = stream.readUInt32();
  //     }
  //     if (def.isMoving()) {
  //       def._vx = stream.readFloat();
  //       def._vy = stream.readFloat();
  //     }
  //     def._color = colors[def._color];
  //   }
  //   let removed = stream.read(['arr16', 'uint32']);
  //   let selfAvatarsInfo = stream.read(['arr8', {'id': 'uint32', 'maxSpeed': 'float', 'protection': 'uint32'}]);
  //   room.frame(now, tick, scale, cellDefs, removed, selfAvatarsInfo);
  //   let arrowPlayerId = stream.readUInt32();
  //   if (arrowPlayerId != room._arrowPlayerId) {
  //     if (arrowPlayerId) {
  //       room._arrowPlayerX = stream.readFloat();
  //       room._arrowPlayerY = stream.readFloat();
  //       if (room._directionPanel._player != players[arrowPlayerId]) {
  //         room._directionPanel._label.text = players[arrowPlayerId]._name;
  //         room._directionPanel._player = players[arrowPlayerId];
  //         room._directionPanel.update();
  //       }
  //       room._directionPanel.visible = true;
  //     } else {
  //       room._directionPanel.visible = false;
  //     }
  //   }
  // }
//
  onPacketLeaderboard(stream) {
    let items = [];
    let count = stream.readUInt8();
    for (; count>0; --count) {
      let id = stream.readUInt32();
      let mass = stream.readUInt32();
      items.push({'id': id, 'name': this._players[id].name, 'mass': mass});
    }
    // TODO: avoid using protected members
    this._room._leaderboard.items = items;
  }

  onPacketPlayer(stream) {
    const playerId = stream.readUInt32();
    const name = stream.readString();
    if (this._players.hasOwnProperty(playerId)) {
      this._players[playerId].name = name;
    } else {
      this._players[playerId] = new PlayerInfo(playerId, name, 3);
    }
  }

  onPacketPlayerRemove(stream) {
    const playerId = stream.readUInt32();
    delete this._players[playerId];
  }

  onPacketPlayerJoin(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status |= 1;
    room._directionPanel.update(); // TODO: fix
  }

  onPacketPlayerLeave(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status &= 0xFE;
    room._directionPanel.update(); // TODO: fix
  }

  onPacketPlayerBorn(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId].status |= 2;
    room._directionPanel.update(); // TODO: fix
  }

  onPacketPlayerDead(stream) {
    const playerId = stream.readUInt32();
    this._players[playerId]._status &= 0xFD;
    room._directionPanel.update(); // TODO: fix
  }

  // TODO: check
  onPacketFinish() {
    if (service.onFinish) {
      service.onFinish();
    }
  }

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

  onPacketSpectate(stream) {
    let playerId = stream.readUInt32();
    let x = stream.readUInt16();
    let y = stream.readUInt16();
    let maxMass = stream.readUInt32();
    room.play(playerId, x, y, maxMass);
    this._isSpectateMode = true;
    if (service.onSpectate) {
      service.onSpectate();
    }
  }

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
