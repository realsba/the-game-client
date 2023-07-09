import Control from './Control';

export default class Panel extends Control {
  constructor(view, config) {
    super(view, config);
  }

  draw() {
    this.clear();
    this.lineStyle(this._config.lineStyle);
    this.beginFill(this._config.fill[0], this._config.fill[1]);
    this.drawRect(0, 0, this._box.width, this._box.height);
    this.endFill();
  }
}
