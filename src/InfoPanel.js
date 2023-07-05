/* global PIXI */

/**
 * @constructor
 * @param {number} count
 */
function MovingAverage(count) {
  this._measurements = []; // TODO: Допиляти circular buffer
  this._value = 0;
  this._count = count || 10;
};

MovingAverage.prototype.push = function (value) {
  this._measurements.push(value);
  if (this._measurements.length == this._count) {
    this._value = this._measurements.reduce(function(pv, cv) { return pv + cv; }, 0) / this._count;
    this.push = function(value) {
      this._measurements.push(value);
      this._value += (-this._measurements.shift() + value) / this._count;
    };
    this.value = function () {
      return this._value >> 0;
    };
  }
};

MovingAverage.prototype.value = function () {
  return '--';
};

/**
 * @constructor
 * @param {Config} config
 */
function InfoPanel(config) {
  PIXI.Graphics.apply(this);

  Object.defineProperties(this, {
    fps: {
      set: function (value) {
        fpsAverage.push(value);
        onChange();
      }
    },
    ping: {
      set: function (value) {
        if (ping != value) {
          ping = value;
          onChange();
        }
      }
    },
    packetsIn: {
      set: function (value) {
        packetsIn.push(value);
        onChange();
      }
    },
    packetsOut: {
      set: function (value) {
        packetsOut.push(value);
        onChange();
      }
    },
    bytesIn: {
      set: function (value) {
        bytesIn.push(value);
        onChange();
      }
    },
    bytesOut: {
      set: function (value) {
        bytesOut.push(value);
        onChange();
      }
    }
  });

  function onChange() {
    var now = Date.now();
    var dt = now - lastUpdate;
    if (dt >= updateInterval) {
      lastUpdate = now;
      update();
    }
  }

  function update() {
    var fps = fpsAverage.value();
    var fpsStyle = fps >= 50 ? 'good' : (fps >= 30 ? 'normal' : 'bad');
    var pingStyle = ping < 100 ? 'good' : (ping < 400 ? 'normal' : 'bad');
    label.text = sprintf('FPS: <%2$s>%1$s</%2$s> ping: <%4$s>%3$s</%4$s>', fps, fpsStyle, ping, pingStyle);
    connectionLabel.text = sprintf('%s/%s %s/%s', packetsIn.value(), packetsOut.value(), bytesIn.value(), bytesOut.value());
    var width = label.width;
    var height = label.height + connectionLabel.height;
    if (_width != width || _height != height) {
      _width = width;
      _height = height;
      self.$resize(_width + 16, _height);
    }
  }

  this._theme = config.infoPanel;
  var self = this;
  var fpsAverage = new MovingAverage();
  var packetsIn = new MovingAverage();
  var packetsOut = new MovingAverage();
  var bytesIn = new MovingAverage();
  var bytesOut = new MovingAverage();
  var lastUpdate = Date.now();
  var updateInterval = 500;
  var ping = '--';
  var label = this.addChild(new PIXI.MultiStyleText('...', this._theme._label));
  label.x = 8;
  var connectionLabel = this.addChild(new PIXI.Text('...', this._theme._connectionLabel));
  connectionLabel.x = 8;
  connectionLabel.y = label.y + label.height;
  var _width = 0;
  var _height = 0;
  update();
}

InfoPanel.prototype = Object.create(PIXI.Graphics.prototype);

InfoPanel.prototype.$resize = function (width, height) {
  this.clear();
  this.lineStyle(this._theme._lineStyle[0], this._theme._lineStyle[1], this._theme._lineStyle[2]);
  this.beginFill(this._theme._fill[0], this._theme._fill[1]);
  this.drawRect(0, 0, width, height);
  this.endFill();
  if (this.onResize) {
    this.onResize();
  }
};
