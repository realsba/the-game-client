import Panel from './ui/Panel';
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

  constructor(view, config) {
    super(view, config);

    this._label.x = 8;
    this._label.style = this._config.label.def;

    this._connectionLabel.x = 8;
    this._connectionLabel.y = this._label.y + this._label.height;
    this._connectionLabel.style = this._config.connectionLabel;

    this.#doUpdate();
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

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    const fps = this._fpsAverage.value();
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
    const bytesIn = this._bytesIn.value();
    const bytesOut = this._bytesOut.value();
    const packetsIn = this._packetsIn.value();
    const packetsOut = this._packetsOut.value();
    this._connectionLabel.text = `${bytesIn}/${bytesOut} ${packetsIn}/${packetsOut}`;
    const width = this._label.width + 16;
    const height = this._label.height + this._connectionLabel.height;
    if (this.resize(width, height)) {
      this.draw();
    }
  }
}
