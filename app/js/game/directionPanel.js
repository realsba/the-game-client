/* global PIXI */

/**
 * @constructor
 * @param {Config} config
 */
function DirectionPanel(config) {
  PIXI.Graphics.apply(this);

  this._theme = config.directionPanel;

  this._textures = {};
  this._textures[0] = PIXI.Texture.fromImage('img/direction-0.png');
  this._textures[1] = PIXI.Texture.fromImage('img/direction-1.png');
  this._textures[2] = PIXI.Texture.fromImage('img/direction-2.png');
  this._textures[3] = PIXI.Texture.fromImage('img/direction-3.png');
  this._sprite = this.addChild(new PIXI.Sprite(this._textures[0]));
  this._sprite.alpha = 0.9;
  this._sprite.anchor.x = 0.5;
  this._sprite.anchor.y = 0.5;

  this._label = this.addChild(new PIXI.MultiStyleText('...', this._theme._label));
  this._label.x = this._sprite.x + 40;
  this._label.anchor.y = 0.5;
  this._live = false;
  /** @type {PlayerInfo} this._player */
  this._player = null;
}

DirectionPanel.prototype = Object.create(PIXI.Graphics.prototype);

DirectionPanel.prototype.setAngle = function (angle) {
  if (this._live) {
    this._sprite.rotation = angle;
  }
};

DirectionPanel.prototype.update = function () {
  if (this._player) {
    this._sprite.texture = this._textures[this._player._status & 3];
    this._live = !!(this._player._status & 2);
    if (!this._live) {
      this._sprite.rotation = 0;
    }
  }
};
