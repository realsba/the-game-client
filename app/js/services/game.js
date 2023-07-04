/* global jBinary, app, colors */

app.factory('game', ['$rootScope', '$localStorage', function ($rootScope, $localStorage) {
  var screenWidth = 0, screenHeight = 0, scaleModifier = 100;
  var displayContainer, socket;
  var config = new Config();
  var ready = false;
  var players = {};
  var mousePosition = {};
  var mousePositionChanged = false;
  var infoPanelLastUpdate = Date.now();
  var frames = 0;
  var packetsIn = 0;
  var packetsOut = 0;
  var bytesIn = 0;
  var bytesOut = 0;
  var stopped = false;
  var isSpectateMode = false;

  var dispatcher = {
    1: onPacketPong,
    2: onPacketGreeting,
    3: onPacketRoom,
    4: onPacketFrame,
    5: onPacketLeaderboard,
    6: onPacketPlayer,
    7: onPacketPlayerRemove,
    8: onPacketPlayerJoin,
    9: onPacketPlayerLeave,
    10: onPacketPlayerBorn,
    11: onPacketPlayerDead,
    12: onPacketPlay,
    13: onPacketSpectate,
    14: onPacketFinish,
    15: onPacketChatMessage
  };

  var typeSetPackets = {
    'str': jBinary.Type({
      'read': function () {
        var length = this.binary.readUInt16();
        return this.binary.read(['string', length]);
      },
      'write': function (value) {
        this.binary.writeUInt16(value.length);
        this.binary.write(['string'], value);
      }
    }),
    'bstr': jBinary.Type({
      'read': function () {
        var length = this.binary.readUInt16();
        var value = this.binary.read(['blob', length]);
        var decoder = new TextDecoder();
        return decoder.decode(value);
      },
      'write': function (value) {
        var encoder = new TextEncoder();
        value = encoder.encode(value);
        this.binary.writeUInt16(value.length);
        this.binary.write(['blob', value.length], value);
      }
    }),
    'arr8': jBinary.Type({
      'params': ['itemType'],
      'resolve': function (getType) {
        this.itemType = getType(this.itemType);
      },
      'read': function () {
        var length = this.binary.readUInt8();
        return this.binary.read(['array', this.itemType, length]);
      },
      'write': function (values) {
        this.binary.writeUInt8(values.length);
        this.binary.write(['array', this.itemType], values);
      }
    }),
    'arr16': jBinary.Type({
      'params': ['itemType'],
      'resolve': function (getType) {
        this.itemType = getType(this.itemType);
      },
      'read': function () {
        var length = this.binary.readUInt16();
        return this.binary.read(['array', this.itemType, length]);
      },
      'write': function (values) {
        this.binary.writeUInt16(values.length);
        this.binary.write(['array', this.itemType], values);
      }
    })
  };

  var room = new Room(config);
  var infoPanel = new InfoPanel(config);
  infoPanel.y = 8;
  infoPanel.onResize = function () {
    infoPanel.x = screenWidth - (this.width + 8);
  };
  var stopSprite = new PIXI.Sprite.fromImage('img/stop.png');
  stopSprite.visible = false;

  function setDisplayContainer(container) {
    displayContainer = container;
    container.addChild(room._graphics);
    container.addChild(infoPanel);
    container.addChild(stopSprite);
  }

  function resize(width, height) {
    screenWidth = width;
    screenHeight = height;
    room.setScreenSize(width, height);
    infoPanel.onResize();
    stopSprite.x = screenWidth - 128; // TODO: change -128 to -stopSprite.width
    stopSprite.y = infoPanel.y + infoPanel.height;
  }

  function send(buffer) {
    socket.send(buffer);
    ++packetsOut;
    bytesOut += buffer.byteLength;
  }

  function update() {
    ++frames;
    var now = Date.now();
    var dt = now - infoPanelLastUpdate;
    if (dt > 250) {
      var k = 1000 / dt;
      infoPanel.fps = frames * k;
      infoPanel.packetsIn = packetsIn * k;
      infoPanel.packetsOut = packetsOut * k;
      infoPanel.bytesIn = bytesIn * k;
      infoPanel.bytesOut = bytesOut * k;
      frames = 0;
      packetsIn = 0;
      packetsOut = 0;
      bytesIn = 0;
      bytesOut = 0;
      infoPanelLastUpdate = now;
    }
    if (ready) {
      if (mousePositionChanged) {
        var x = stopped || isSpectateMode ? 0 : (mousePosition.x - 0.5 * screenWidth) / room._scale;
        var y = stopped || isSpectateMode ? 0 : (mousePosition.y - 0.5 * screenHeight) / room._scale;
        var binary = new jBinary(5);
        binary.writeUInt8(5);
        binary.writeUInt16(x);
        binary.writeUInt16(y);
        send(binary.view.buffer);
        mousePositionChanged = false;
        room._pointerX = x;
        room._pointerY = y;
      }
      room.$update();
    }
  }

  function sendGreeting(sid) {
    var binary = new jBinary(35, typeSetPackets);
    binary.writeUInt8(3);
    binary.write('str', sid ? sid : '');
    send(binary.view.buffer);
  }

  function actionPlay(name, color) {
    var binary = new jBinary(64, typeSetPackets);
    binary.writeUInt8(4);
    binary.write('bstr', name);
    binary.writeUInt8(color);
    send(binary.slice(0, binary.tell(), true).view.buffer);
  }

  function actionSpectate(playerId) {
    var binary = new jBinary(5);
    binary.writeUInt8(8);
    binary.writeUInt32(playerId);
    send(binary.view.buffer);
  }

  function actionEject(point) {
    if (ready) {
      var binary = new jBinary(5);
      binary.writeUInt8(6);
      binary.writeUInt16(room._player._x + (point.x - 0.5 * screenWidth) / room._scale);
      binary.writeUInt16(room._player._y + (point.y - 0.5 * screenHeight) / room._scale);
      send(binary.view.buffer);
    }
  }

  function actionSplit(point) {
    if (ready) {
      var binary = new jBinary(5);
      binary.writeUInt8(7);
      binary.writeUInt16(room._player._x + (point.x - 0.5 * screenWidth) / room._scale);
      binary.writeUInt16(room._player._y + (point.y - 0.5 * screenHeight) / room._scale);
      send(binary.view.buffer);
    }
  }

  function chatMessage(text) {
    if (ready) {
      var binary = new jBinary(1024, typeSetPackets);
      binary.writeUInt8(2);
      binary.write('bstr', text);
      send(binary.slice(0, binary.tell(), true).view.buffer);
    }
  }

  function paint(pos) {
    if (ready) {
      console.log(pos); // TODO: remove
    }
  }

  function stop(value) {
    stopSprite.visible = value;
  }

  function setMousePosition(point) {
    if (point === false || point === true) {
      if (stopped != point) {
        stopped = point;
        mousePositionChanged = true;
      }
      return;
    }
    if (mousePosition.x != point.x || mousePosition.y != point.y) {
      mousePosition.x = point.x;
      mousePosition.y = point.y;
      mousePositionChanged = true;
    }
  }

  function startConnection(url) {
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = function () {
      function checkReadyState () {
        if (socket.readyState == 0) {
          setTimeout(checkReadyState, 50);
          return;
        }
        sendGreeting($localStorage['sid']);
        ping();
      }
      checkReadyState();
    };
    socket.onclose = function () {
      if (service.onConnectionLoss) {
        service.onConnectionLoss();
      }
      socket = null;
      ready = false;
      room.init();
    };
    socket.onmessage = function (event) {
      var binary = new jBinary(event.data, typeSetPackets);
      while (binary.view.byteLength > binary.tell()) {
        var type = binary.readUInt8();
        if (dispatcher.hasOwnProperty(type)) {
          dispatcher[type](binary);
        }
        ++packetsIn;
        bytesIn += binary.view.byteLength;
      }
    };
  }

  function incScale() {
    if (scaleModifier < 200) {
      scaleModifier += 10;
      room.setScaleRatio(0.01 * scaleModifier);
    }
  }

  function decScale() {
    if (scaleModifier > 10) {
      scaleModifier -= 10;
      room.setScaleRatio(0.01 * scaleModifier);
    }
  }

  function resetScale() {
    if (scaleModifier != 100) {
      scaleModifier = 100;
      room.setScaleRatio(0.01 * scaleModifier);
    }
  }

  var lastPingTime;
  function ping() {
    if (socket) {
      var binary = new jBinary(1);
      binary.writeUInt8(1);
      send(binary.view.buffer);
      lastPingTime = Date.now();
    }
  }
  function onPacketPong() {
    var now = Date.now();
    infoPanel.ping = (now - lastPingTime) >> 0;
    lastPingTime = now;
    setTimeout(ping, 2500);
  }

  function onPacketGreeting(stream) {
    var sid = stream.read(['str']);
    if (sid) {
      $localStorage['sid'] = sid;
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketRoom(stream) {
    var width = stream.readUInt16();
    var height = stream.readUInt16();
    var viewportBase = stream.readUInt16();
    var viewportBuffer = stream.readFloat();
    var aspectRatio = stream.readFloat();
    var resistanceRatio = stream.readFloat();
    var elasticityRatio = stream.readFloat();
    var foodResistanceRatio = stream.readFloat();
    var count = stream.readUInt8();
    for (; count>0; --count) {
      var id = stream.readUInt32();
      var name = stream.read('bstr');
      var status = stream.readUInt8();
      players[id] = new PlayerInfo(id, name, status) ;
    }
    $rootScope['chatHistory'] = [];
    count = stream.readUInt8();
    for (; count>0; --count) {
      var authorId = stream.readUInt32();
      var author = stream.read('bstr');
      var text = stream.read('bstr');
      $rootScope['chatHistory'].push({'authorId': authorId, 'author': author, 'text': text});
      $rootScope.$apply();
    }
    room.init();
    room._socket = socket;
    room._width = width;
    room._height = height;
    room._visibleHeight = viewportBase;
    room._visibleWidth = viewportBase * aspectRatio;
    room._viewportBuffer = viewportBuffer;
    room._resistanceRatio = resistanceRatio;
    room._elasticityRatio = elasticityRatio; // TODO: not used
    room._foodResistanceRatio = foodResistanceRatio;
    room._player._x = 0.5 * width;
    room._player._y = 0.5 * height;
    room.setScreenSize(screenWidth, screenHeight);
    ready = true;
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketFrame(stream) {
    var now = Date.now();
    var tick = stream.readUInt32();
    var scale = stream.readFloat();
    var cellDefs = [];
    var cnt = stream.readUInt16();
    for (; cnt>0; --cnt) {
      var def = new CellDef();
      cellDefs.push(def);
      def._type = stream.readUInt8();
      def._id = stream.readUInt32();
      def._x = stream.readFloat();
      def._y = stream.readFloat();
      def._mass = stream.readUInt32();
      def._radius = stream.readUInt16();
      def._color = stream.readUInt8();
      if (def.isAvatar()) {
        def._playerId = stream.readUInt32();
        def._name = players[def._playerId]._name;
        // def._protection = stream.readUInt32();
      }
      if (def.isMoving()) {
        def._vx = stream.readFloat();
        def._vy = stream.readFloat();
      }
      def._color = colors[def._color];
    }
    var removed = stream.read(['arr16', 'uint32']);
    var selfAvatarsInfo = stream.read(['arr8', {'id': 'uint32', 'maxSpeed': 'float', 'protection': 'uint32'}]);
    room.frame(now, tick, scale, cellDefs, removed, selfAvatarsInfo);
    var arrowPlayerId = stream.readUInt32();
    if (arrowPlayerId != room._arrowPlayerId) {
      if (arrowPlayerId) {
        room._arrowPlayerX = stream.readFloat();
        room._arrowPlayerY = stream.readFloat();
        if (room._directionPanel._player != players[arrowPlayerId]) {
          room._directionPanel._label.text = players[arrowPlayerId]._name;
          room._directionPanel._player = players[arrowPlayerId];
          room._directionPanel.update();
        }
        room._directionPanel.visible = true;
      } else {
        room._directionPanel.visible = false;
      }
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketLeaderboard(stream) {
    var items = [];
    var count = stream.readUInt8();
    for (; count>0; --count) {
      var id = stream.readUInt32();
      var mass = stream.readUInt32();
      // TODO: замінти на PlayerInfo
      items.push({'id': id, 'name': players[id]._name, 'mass': mass});
    }
    room._leaderboard.items = items;
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayer(stream) {
    var playerId = stream.readUInt32();
    var name = stream.read('bstr');
    if (players.hasOwnProperty(playerId)) {
      players[playerId]._name = name;
    } else {
      players[playerId] = new PlayerInfo(playerId, name, 3);
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayerRemove(stream) {
    var playerId = stream.readUInt32();
    delete players[playerId];
    $rootScope.$apply();
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayerJoin(stream) {
    var playerId = stream.readUInt32();
    players[playerId]._status |= 1;
    room._directionPanel.update();
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayerLeave(stream) {
    var playerId = stream.readUInt32();
    players[playerId]._status &= 0xFE;
    room._directionPanel.update();
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayerBorn(stream) {
    var playerId = stream.readUInt32();
    players[playerId]._status |= 2;
    room._directionPanel.update();
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlayerDead(stream) {
    var playerId = stream.readUInt32();
    players[playerId]._status &= 0xFD;
    room._directionPanel.update();
  }

  function onPacketFinish() {
    if (service.onFinish) {
      service.onFinish();
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketPlay(stream) {
    var playerId = stream.readUInt32();
    var x = stream.readUInt16();
    var y = stream.readUInt16();
    var maxMass = stream.readUInt32();
    room.play(playerId, x, y, maxMass);
    isSpectateMode = false;
    if (service.onPlay) {
      service.onPlay();
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketSpectate(stream) {
    var playerId = stream.readUInt32();
    var x = stream.readUInt16();
    var y = stream.readUInt16();
    var maxMass = stream.readUInt32();
    room.play(playerId, x, y, maxMass);
    isSpectateMode = true;
    if (service.onSpectate) {
      service.onSpectate();
    }
  }

  /**
   * @param {jBinary} stream
   */
  function onPacketChatMessage(stream) {
    var authorId = stream.readUInt32();
    var text = stream.read('bstr');
    var msg = {
      'authorId': authorId,
      'author': players.hasOwnProperty(authorId) ? players[authorId]._name : '',
      'text': text
    };
    $rootScope['chatMessages'].push(msg);
    $rootScope['chatHistory'].unshift(msg);
    $rootScope.$apply();
  }

  function getPlayers() {
    var arr = {};
    for (var id in players) {
      var info = players[id];
      arr[id] = info._name;
    }
    return arr;
  }

  var service = {
    setDisplayContainer: setDisplayContainer,
    resize: resize,
    update: update,
    startConnection: startConnection,
    setMousePosition: setMousePosition,
    actionPlay: actionPlay,
    actionSpectate: actionSpectate,
    actionEject: actionEject,
    actionSplit: actionSplit,
    chatMessage: chatMessage,
    paint: paint,
    stop: stop,
    incScale: incScale,
    decScale: decScale,
    resetScale: resetScale,
    getPlayers: getPlayers
  };

  return service;
}]);
