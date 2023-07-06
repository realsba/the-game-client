import { Graphics } from 'pixi.js';

export default class Panel extends Graphics {
  _onResize = null;

  constructor(config) {
    super();
    this._config = config;
  }

  set onResize(value) {
    this._onResize = value;
  }

  resize(width, height) {
    this.clear();
    this.lineStyle(this._config.lineStyle);
    this.beginFill(this._config.fill[0], this._config.fill[1]);
    this.drawRect(0, 0, width, height);
    this.endFill();
    if (this._onResize) {
      this._onResize();
    }
  }
}
