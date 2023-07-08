import { Graphics, Rectangle } from 'pixi.js';

export default class Panel extends Graphics {
  _onResize = null;
  _box = new Rectangle;

  constructor(view, config) {
    super();

    if (view) {
      view.addChild(this);
    }

    this._config = config || {};
  }

  set onResize(value) {
    this._onResize = value;
  }

  resize(width, height) {
    if (this._box.width === width && this._box.height === height) {
      return;
    }
    this._box.width = width;
    this._box.height = height;
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
