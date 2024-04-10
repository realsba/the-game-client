import {Container, Rectangle} from 'pixi.js';

export default class Control extends Container {
  #onResize = null;
  _box = new Rectangle();
  _config = null;

  constructor(view, config) {
    super();

    if (view) {
      view.addChild(this);
    }

    this._config = config || {};
  }

  set onResize(value) {
    this.#onResize = value;
  }

  resize(width, height) {
    if (this._box.width === width && this._box.height === height) {
      return false;
    }
    this._box.width = width;
    this._box.height = height;
    this.draw();
    if (this.#onResize) {
      this.#onResize();
    }
    return true;
  }
}
