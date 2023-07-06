import Panel from './Panel';
import { Text } from 'pixi.js';
import { delayed_call } from "./utils";

class MovingAverage {
  _measurements = []; // TODO: implement circular buffer
  _value = 0;
  _count = 10;

  constructor(count) {
    if (count) {
      this._count = count;
    }
  }

  push(value) {
    this._measurements.push(value);
    if (this._measurements.length === this._count) {
      this._value = this._measurements.reduce(function (pv, cv) {
        return pv + cv;
      }, 0) / this._count;
      this.push = (value) => {
        this._measurements.push(value);
        this._value += (-this._measurements.shift() + value) / this._count;
      };
      this.value = () => this._value >> 0;
    }
  }

  value() {
    return '--';
  };
}

export default class InfoPanel extends Panel {
  _ping = 0;
  _fpsAverage = new MovingAverage();
  _packetsIn = new MovingAverage();
  _packetsOut = new MovingAverage();
  _bytesIn = new MovingAverage();
  _bytesOut = new MovingAverage();

  // TODO: use https://npm.io/package/pixi-tagged-text
  _label = this.addChild(new Text('...'));
  _connectionLabel = this.addChild(new Text('...'));

  _width = 0;
  _height = 0;

  constructor(config) {
    super();
    this._config = config;
    this._label.x = 8;
    this._label.style = this._config.label.def;
    this._connectionLabel.x = 8;
    this._connectionLabel.y = this._label.y + this._label.height;
    this._connectionLabel.style = this._config.label.good;
    this.update();
  }

  set fps(value) {
    this._fpsAverage.push(value);
    this.update();
  }

  set ping(value) {
    if (this._ping !== value) {
      this._ping = value;
      this.update();
    }
  }

  set packetsIn(value) {
    this._packetsIn.push(value);
    this.update();
  }

  set packetsOut(value) {
    this._packetsOut.push(value);
    this.update();
  }

  set bytesIn(value) {
    this._bytesIn.push(value);
    this.update();
  }

  set bytesOut(value) {
    this._bytesOut.push(value);
    this.update();
  }

  onChange() {
    let now = Date.now();
    let dt = now - this._lastUpdate;
    if (dt >= this._updateInterval) {
      this._lastUpdate = now;
      this.update();
    }
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    let fps = this._fpsAverage.value();
    // let fpsStyle = fps >= 50 ? 'good' : (fps >= 30 ? 'normal' : 'bad');
    // let pingStyle = this._ping < 100 ? 'good' : (this._ping < 400 ? 'normal' : 'bad');
    // this.#label.text = sprintf(
    //   'FPS: <%2$s>%1$s</%2$s> ping: <%4$s>%3$s</%4$s>', fps, fpsStyle, this._ping, pingStyle
    // ); // TODO:
    this._label.text = `FPS: ${fps} ping: ${this._ping}`;

    // this.#connectionLabel.text = sprintf(
    //   '%s/%s %s/%s',
    //   this._packetsIn.value(), this._packetsOut.value(),
    //   this._bytesIn.value(), this._bytesOut.value()
    // );
    let bytesIn = this._bytesIn.value();
    let bytesOut = this._bytesOut.value();
    let packetsIn = this._packetsIn.value();
    let packetsOut = this._packetsOut.value();
    this._connectionLabel.text = `${bytesIn}/${bytesOut} ${packetsIn}/${packetsOut}`;
    let width = this._label.width;
    let height = this._label.height + this._connectionLabel.height;
    if (this._rectangleWidth !== width || this._rectangleHeight !== height) {
      this._rectangleWidth = width;
      this._rectangleHeight = height;
      this.resize(width + 16, height);
    }
  }
}
