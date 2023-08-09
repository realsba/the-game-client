import * as PIXI from 'pixi.js';

export default class DirectionPanel extends PIXI.Graphics {
  static TEXTURE_ID_MASK = 3;
  static PLAYER_ALIVE_MASK = 2;

  #textures = {};
  #sprite = null;
  #label = null;
  #live = false;
  #playerInfo = null;

  constructor(config) {
    super();

    this.#textures[0] = PIXI.Texture.from('img/direction-0.png');
    this.#textures[1] = PIXI.Texture.from('img/direction-1.png');
    this.#textures[2] = PIXI.Texture.from('img/direction-2.png');
    this.#textures[3] = PIXI.Texture.from('img/direction-3.png');
    this.#sprite = this.addChild(new PIXI.Sprite(this.#textures[0]));
    this.#sprite.alpha = 0.9;
    this.#sprite.anchor.x = 0.5;
    this.#sprite.anchor.y = 0.5;

    this.#label = this.addChild(new PIXI.Text('', config.label.def));
    this.#label.x = this.#sprite.x + 40;
    this.#label.anchor.y = 0.5;
  }

  setAngle(value) {
    if (this.#live) {
      this.#sprite.rotation = value;
    }
  }

  set playerInfo(value) {
    if (this.#playerInfo !== value) {
      this.#playerInfo = value;
      if (value) {
        this.#label.text = value.name;
      } else {
        this.#label.text = '';
      }
    }
    this.update();
  }

  update() {
    if (this.#playerInfo) {
      this.#sprite.texture = this.#textures[this.#playerInfo.status & DirectionPanel.TEXTURE_ID_MASK];
      this.#live = !!(this.#playerInfo.status & DirectionPanel.PLAYER_ALIVE_MASK);
      if (!this.#live) {
        this.#sprite.rotation = 0;
      }
    }
  }
}
