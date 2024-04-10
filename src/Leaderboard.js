import * as PIXI from 'pixi.js';
import { List } from "@pixi/ui";
import Panel from './ui/Panel';
import { delayed_call } from './utils.js';

class Item extends List {
  #labelNumber = new PIXI.Text();
  #labelName = new PIXI.Text();
  #labelMass = new PIXI.Text();

  #styleSelf;
  #styleDef;

  set name(value) {
    this.#labelName.text = value;
    this.#update();
  }

  set mass(value) {
    this.#labelMass.text = value;
    this.#update();
  }

  set highlight(value) {
    this.#labelName.style = value ? this.#styleSelf : this.#styleDef;
  }

  constructor(options, config, number) {
    super(options);

    this.#styleSelf = new PIXI.TextStyle(config.list.self);
    this.#styleDef = new PIXI.TextStyle(config.list.def);

    this.#labelNumber.text = number;
    this.#labelNumber.style = config.list.number;
    this.#labelName.style = this.#styleDef;
    this.#labelMass.style = config.list.mass;
    this.addChild(this.#labelNumber, this.#labelName, this.#labelMass);
  }

  #update() {
    this.arrangeChildren();
    this.children[0].y = this.height - this.children[0].height - 1;
    this.children[2].y = this.height - this.children[2].height - 2;
  }
}

export default class Leaderboard extends Panel {
  static ELEMENTS_MARGIN = 4;
  static MIN_WIDTH = 200;
  static MAX_ITEMS = 20;

  #items = [];
  #playerId = 0;
  #title = this.addChild(new PIXI.Text({text: 'Leaderboard'}));
  #list = this.addChild(new List({type: 'vertical', vertPadding: 8, horPadding: 8}));
  #onMouseDown = null;

  constructor(view, config) {
    super(view, config);

    this.#title.style = this._config.title;
    this.#title.x = 0.5 * (this.width - this.#title.width);
    this.#title.y = 4;

    this.#list.y = this.#title.height;

    for (let i = 0; i < Leaderboard.MAX_ITEMS; ++i) {
      const item = this.#list.addChild(
        new Item({type: 'horizontal', elementsMargin: Leaderboard.ELEMENTS_MARGIN}, config, i + 1)
      );
      item.eventMode = 'static';
      item.visible = false;
      item.onmousedown = event => {
        if (this.#onMouseDown) {
          this.#onMouseDown(event);
        }
      };
    }

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
    this.#items.forEach((v, i) => {
      const item = this.#list.children[i];
      item.playerId = v.id;
      item.name = v.name;
      item.mass = v.mass;
      item.visible = true;
      item.highlight = this.#playerId === v.id;
    });
    for (let i = this.#items.length; i < Leaderboard.MAX_ITEMS; ++i) {
      this.#list.children[i].visible = false;
    }
    const width = this.#list.width + 2 * this.#list.horPadding;
    const height = this.#title.height + this.#list.height + 2 * this.#list.vertPadding;
    if (this.resize(width < Leaderboard.MIN_WIDTH ? Leaderboard.MIN_WIDTH : width, height)) {
      this.#title.x = 0.5 * (this.width - this.#title.width);
    }
  }
}
