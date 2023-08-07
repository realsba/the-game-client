import * as PIXI from "pixi.js";
import { List } from "@pixi/ui";
import Panel from './ui/Panel.js';
import { delayed_call } from './utils.js';

export default class PlayerInfoPanel extends Panel {
  #posX = 0;
  #posY = 0;
  #mass = 0;
  #maxMass = 0;

  #label;
  #textPosition;
  #textMass;
  #textMaxMass;

  #styleLower;
  #styleBest;

  constructor(view, config) {
    super(view, config);

    this.#styleLower = new PIXI.TextStyle(this._config.label.lower);
    this.#styleBest = new PIXI.TextStyle(this._config.label.best);

    this.#textPosition = new PIXI.Text('', this._config.label.property);
    this.#textMass = new PIXI.Text('');
    this.#textMaxMass = new PIXI.Text('', this._config.label.maxMass);

    this.#label = new List({
      type: 'horizontal',
      elementsMargin: 4,
      horPadding: 4,
      vertPadding: 2,
      children: [
        this.#textPosition,
        new PIXI.Text('mass:', this._config.label.def),
        this.#textMass,
        new PIXI.Text('max:', this._config.label.def),
        this.#textMaxMass
      ]
    });
    this.addChild(this.#label);

    this.#doUpdate();
  }

  set posX(value) {
    if (this.#posX !== value) {
      this.#posX = value;
      this.update();
    }
  }

  set posY(value) {
    if (this.#posY !== value) {
      this.#posY = value;
      this.update();
    }
  }

  set mass(value) {
    if (this.#mass !== value) {
      this.#mass = value;
      if (this.#maxMass < value) {
        this.#maxMass = value;
      }
      this.update();
    }
  }

  set maxMass(value) {
    if (this.#maxMass !== value) {
      this.#maxMass = value;
      this.update();
    }
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    this.#textMass.style = this.#mass < this.#maxMass ? this.#styleLower : this.#styleBest;

    this.#textPosition.text = `${this.#posX}:${this.#posY}`;
    this.#textMass.text = this.#mass;
    this.#textMaxMass.text = this.#maxMass;
    this.#label.arrangeChildren();
    this.#label.children[1].y = this.#label.height - this.#label.children[1].height;
    this.#label.children[3].y = this.#label.height - this.#label.children[3].height;

    const width = this.#label.width + 2 * this.#label.horPadding;
    const height = this.#label.height + 2 * this.#label.vertPadding;
    this.resize(width, height);
  }
}
