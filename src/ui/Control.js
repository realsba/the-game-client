import { Graphics, Rectangle } from 'pixi.js';

export default class Control extends Graphics {
  _onResize = null;
  _box = new Rectangle();

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
      return false;
    }
    this._box.width = width;
    this._box.height = height;
    this.draw();
    if (this._onResize) {
      this._onResize();
    }
    return true;
  }
}
