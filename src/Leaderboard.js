import Panel from './ui/Panel';
import { Graphics, Text } from 'pixi.js';
import { delayed_call } from './utils.js';

export default class Leaderboard extends Panel {
  static MIN_WIDTH = 200;
  static MAX_ITEMS = 20;

  #items = [];
  #playerId = 0;
  #title = this.addChild(new Text('Leaderboard'));
  #list = this.addChild(new Graphics());
  #labels = {};
  #onMouseDown = null;

  constructor(view, config) {
    super(view, config);

    this.#title.style = this._config.title;
    this.#title.x = 0.5 * (this.width - this.#title.width);
    this.#title.y = 4;

    for (let i = 0; i < Leaderboard.MAX_ITEMS; ++i) {
      let label = this.#list.addChild(new Text('', this._config.list.def));
      this.#labels[i] = label;
      label.eventMode = 'static';
      label.y = this.#labels[i].height * i;
      label.visible = false;
      label.onmousedown = (mouse) => {
        if (this.#onMouseDown) {
          this.#onMouseDown(mouse);
        }
      };
    }
    this.#list.x = 8;
    this.#list.y = this.#title.height;

    this.#doUpdate();
  }

  set onMouseDown(value) {
    this.#onMouseDown = value;
  }

  set items(value) {
    this.#items = value;
    this.update();
  }

  set playerId(value) {
    this.#playerId = value;
    this.#doUpdate();
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    this.#items.forEach((item, i) => {
      const label = this.#labels[i];
      const style = this.#playerId === item.id ? 'self' : 'def';
      // TODO: use multi style
      label.text = `${i + 1} ${item.name} ${item.mass}`;
      label.style = this._config.list[style] ;
      label.visible = true;
      label.playerId = item.id;
    });
    for (let i = this.#items.length; i < Leaderboard.MAX_ITEMS; ++i) {
      this.#labels[i].visible = false;
    }
    const width = this.#list.width + 16;
    const height = this.#title.height + this.#list.height + 8;
    if (this.resize(width < Leaderboard.MIN_WIDTH ? Leaderboard.MIN_WIDTH : width, height)) {
      this.#title.x = 0.5 * (this.width - this.#title.width);
    }
  }
}
