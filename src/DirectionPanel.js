import {Graphics, Sprite, Texture, Text} from "pixi.js";

export default class DirectionPanel extends Graphics {
  _textures = {};
  _sprite = null;
  _label = null;

  constructor(config) {
    super();

    this._config = config;

    this._textures[0] = Texture.from('img/direction-0.png');
    this._textures[1] = Texture.from('img/direction-1.png');
    this._textures[2] = Texture.from('img/direction-2.png');
    this._textures[3] = Texture.from('img/direction-3.png');
    this._sprite = this.addChild(new Sprite(this._textures[0]));
    this._sprite.alpha = 0.9;
    this._sprite.anchor.x = 0.5;
    this._sprite.anchor.y = 0.5;

    this._label = this.addChild(new Text('...', this._config.label.def));
    this._label.x = this._sprite.x + 40;
    this._label.anchor.y = 0.5;
    this._live = false;
    this._player = null;
  }

  set angle(value) {
    if (this._live) {
      this._sprite.rotation = value;
    }
  }

  set player(value) {
    this._player = value;
  }

  update() {
    if (this._player) {
      this._sprite.texture = this._textures[this._player.status & 3]; // TODO: avoid magic numbers
      this._live = !!(this._player.status & 2); // TODO: avoid magic numbers
      if (!this._live) {
        this._sprite.rotation = 0;
      }
    }
  }
}
