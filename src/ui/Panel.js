import Control from './Control.js';
import {Graphics} from 'pixi.js';

export default class Panel extends Control {
  _view = new Graphics();

  constructor(view, config) {
    super(view, config);

    this.addChild(this._view);
  }

  draw() {
    this._view.clear();
    this._view.rect(0, 0, this._box.width, this._box.height);
    this._view.fill(this._config.fill);
    this._view.stroke(this._config.stroke);
  }
}
