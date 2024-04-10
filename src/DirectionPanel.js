import {Container, Graphics, Assets, Texture, Sprite, Text} from 'pixi.js';

export default class DirectionPanel extends Container {
  static TEXTURE_ID_MASK = 3;
  static PLAYER_ALIVE_MASK = 2;

  #assets = {};
  #sprite = null;
  #label = null;
  #live = false;
  #playerInfo = null;
  #view = new Graphics();

  constructor(config) {
    super();

    this.addChild(this.#view);

    Assets.addBundle('icons', [
      { alias: '0', src: 'img/direction-0.png' },
      { alias: '1', src: 'img/direction-1.png' },
      { alias: '2', src: 'img/direction-2.png' },
      { alias: '3', src: 'img/direction-3.png' },
    ]);

    this.#label = this.addChild(new Text({style: config.label.def}));

    this.#loadAssets();
  }

  async #loadAssets() {
    this.#assets = await Assets.loadBundle('icons');

    this.#sprite = this.addChild(new Sprite(this.#assets['0']));
    this.#sprite.alpha = 0.9;
    this.#sprite.anchor.x = 0.5;
    this.#sprite.anchor.y = 0.5;

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
      this.#sprite.texture = this.#assets['' + (this.#playerInfo.status & DirectionPanel.TEXTURE_ID_MASK)];
      this.#live = !!(this.#playerInfo.status & DirectionPanel.PLAYER_ALIVE_MASK);
      if (!this.#live) {
        this.#sprite.rotation = 0;
      }
    }
  }
}
