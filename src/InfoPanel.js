import * as PIXI from 'pixi.js';
import { List } from "@pixi/ui";
import Panel from './ui/Panel.js';
import { delayed_call } from './utils.js';

export class MovingAverage {
  #measurements = []; // TODO: implement circular buffer
  #value = 0;
  #size = 10;

  constructor(size) {
    if (size) {
      this.#size = size;
    }
  }

  push(value) {
    this.#measurements.push(value);
    if (this.#measurements.length === this.#size) {
      this.#value = this.#measurements.reduce((acc, val) => acc + val, 0) / this.#size;
      this.push = value => {
        this.#measurements.push(value);
        this.#value += (-this.#measurements.shift() + value) / this.#size;
      };
      this.value = () => this.#value >> 0;
    }
  }

  value() {
    return '--';
  };
}

export default class InfoPanel extends Panel {
  #ping = 0;
  #fpsAverage = new MovingAverage();
  #packetsIn = new MovingAverage();
  #packetsOut = new MovingAverage();
  #bytesIn = new MovingAverage();
  #bytesOut = new MovingAverage();

  #layout;
  #textFPS = new PIXI.Text('');
  #textPing = new PIXI.Text('');
  #label;
  #connectionLabel = new PIXI.Text('');

  #styleDefault;
  #styleGood;
  #styleNormal;
  #styleBad;

  constructor(view, config) {
    super(view, config);

    this.#styleDefault = new PIXI.TextStyle(this._config.label.def);
    this.#styleGood = new PIXI.TextStyle(this._config.label.good);
    this.#styleNormal = new PIXI.TextStyle(this._config.label.normal);
    this.#styleBad = new PIXI.TextStyle(this._config.label.bad);

    this.#label = new List({
      type: 'horizontal',
      elementsMargin: 4,
      children: [
        new PIXI.Text('FPS:', this.#styleDefault),
        this.#textFPS,
        new PIXI.Text('ping:', this.#styleDefault),
        this.#textPing
      ]
    });

    this.#layout = this.addChild(
      new List(
        {
          type: 'vertical',
          horPadding: 4,
          vertPadding: 2,
          children: [this.#label, this.#connectionLabel]
        }
      )
    );

    this.#connectionLabel.style = this._config.connectionLabel;

    this.#doUpdate();
  }

  set fps(value) {
    this.#fpsAverage.push(value);
    this.update();
  }

  set ping(value) {
    if (this.#ping !== value) {
      this.#ping = value;
      this.update();
    }
  }

  set packetsIn(value) {
    this.#packetsIn.push(value);
    this.update();
  }

  set packetsOut(value) {
    this.#packetsOut.push(value);
    this.update();
  }

  set bytesIn(value) {
    this.#bytesIn.push(value);
    this.update();
  }

  set bytesOut(value) {
    this.#bytesOut.push(value);
    this.update();
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    const fps = this.#fpsAverage.value();

    this.#textFPS.text = fps;
    this.#textFPS.style = fps >= 50 ? this.#styleGood : (fps >= 30 ? this.#styleNormal : this.#styleBad);
    this.#textPing.text = this.#ping;
    this.#textPing.style = this.#ping < 100 ? this.#styleGood : (this.#ping < 400 ? this.#styleNormal : this.#styleBad);
    this.#label.arrangeChildren();

    const bytesIn = this.#bytesIn.value();
    const bytesOut = this.#bytesOut.value();
    const packetsIn = this.#packetsIn.value();
    const packetsOut = this.#packetsOut.value();
    this.#connectionLabel.text = `${packetsIn}/${packetsOut} ${bytesIn}/${bytesOut}`;

    const width = this.#layout.width + 2 * this.#layout.horPadding;
    const height = this.#layout.height + 2 * this.#layout.vertPadding;
    this.resize(width, height);
  }
}
