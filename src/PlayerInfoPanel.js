import Panel from './ui/Panel.js';
import Label from "./ui/Label.js";
import { delayed_call } from './utils.js';
import * as PIXI from "pixi.js";

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

    this.#label = new Label({
      children: [
        this.#textPosition,
        new PIXI.Text('mass:', this._config.label.def),
        this.#textMass,
        new PIXI.Text('max:', this._config.label.def),
        this.#textMaxMass
      ]
    });
    this.#label.x = 4;
    this.#label.elementsMargin = 4;
    this.addChild(this.#label);

    this.#doUpdate();
    this.#doUpdate(); // required for initial Label resizing
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

    const width = 8 + this.#label.getChildrenWidth();
    this.resize(width, this.#label.height);

    this.#label.arrangeChildren();
    this.#label.children[1].y = this.#label.height - this.#label.children[1].height - 2;
    this.#label.children[3].y = this.#label.height - this.#label.children[3].height - 2;
  }
}
