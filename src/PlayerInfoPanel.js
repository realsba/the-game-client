import Panel from './Panel';
import { Text } from 'pixi.js';
import { delayed_call } from './utils';

export default class PlayerInfoPanel extends Panel {
  _posX = 0;
  _posY = 0;
  _mass = 0;
  _maxMass = 0;

  _label = this.addChild(new Text('...'));
  _rectangleWidth = 0;
  _rectangleHeight = 0;

  constructor(config) {
    super();

    this._config = config;

    this._label.style = this._config.label;
    this._label.position.x = 8;
    this.update();
  }

  set posX(value) {
    if (this._posX !== value) {
      this._posX = value;
      this.update();
    }
  }

  set posY(value) {
    if (this._posY !== value) {
      this._posY = value;
      this.update();
    }
  }

  set mass(value) {
    if (this._mass !== value) {
      this._mass = value;
      if (this._maxMass < value) {
        this._maxMass = value;
      }
      this.update();
    }
  }

  set maxMass(value) {
    if (this._maxMass !== value) {
      this._maxMass = value;
      this.update();
    }
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    console.log('doUpdate');
    // TODO: use multi style text
    // let style = mass < maxMass ? 'lower' : 'best';
    // let fmt = posX + ';' + posY;
    // fmt += ' <property>mass:</property> <%1$s>' + mass + '</%1$s>';
    // fmt += ' <property>max:</property> <maxMass>' + maxMass + '</maxMass>';
    // label.text = sprintf(fmt, style);
    this._label.text = `${this._posX}:${this._posY} mass: ${this._mass} max: ${this._maxMass}`;
    let width = this._label.width;
    let height = this._label.height;
    if (this._rectangleWidth !== width || this._rectangleHeight !== height) {
      this._rectangleWidth = width;
      this._rectangleHeight = height;
      this.resize(width + 16, height);
    }
  }
}
