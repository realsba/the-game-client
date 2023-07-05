/* global PIXI */

/**
 * @constructor
 * @param {Config} config
 */
function PlayerInfoPanel(config) {
  PIXI.Graphics.apply(this);

  Object.defineProperties(this, {
    posX: {
      set: function (value) {
        if (posX != value) {
          posX = value;
          update();
        }
      }
    },
    posY: {
      set: function (value) {
        if (posY != value) {
          posY = value;
          update();
        }
      }
    },
    mass: {
      set: function (value) {
        if (mass != value) {
          mass = value;
          if (maxMass < mass) {
            maxMass = mass;
          }
          update();
        }
      }
    },
    maxMass: {
      set: function (value) {
        if (maxMass != value) {
          maxMass = value;
          update();
        }
      }
    }
  });

  function update() {
    if (timeoutId) {
      return;
    }
    timeoutId = setTimeout(function() {
      timeoutId = null;
      var style = mass < maxMass ? 'lower' : 'best';
      var fmt = posX + ';' + posY;
      fmt += ' <property>mass:</property> <%1$s>' + mass + '</%1$s>';
      fmt += ' <property>max:</property> <maxMass>' + maxMass + '</maxMass>';
      label.text = sprintf(fmt, style);
      var width = label.width;
      var height = label.height;
      if (labelWidth != width || labelHeight != height) {
        labelWidth = width;
        labelHeight = height;
        self.$resize(labelWidth + 16, labelHeight);
      }
    }, 250);
  }

  this._theme = config.playerInfoPanel;
  var self = this;
  var posX = 0;
  var posY = 0;
  var mass = 0;
  var maxMass = 0;
  var label = this.addChild(new PIXI.MultiStyleText('...', this._theme._label));
  label.position.x = 8;
  var labelWidth = 0;
  var labelHeight = 0;
  var timeoutId = null;
  update();
}

PlayerInfoPanel.prototype = Object.create(PIXI.Graphics.prototype);

PlayerInfoPanel.prototype.$resize = function (width, height) {
  this.clear();
  this.lineStyle(this._theme._lineStyle[0], this._theme._lineStyle[1], this._theme._lineStyle[2]);
  this.beginFill(this._theme._fill[0], this._theme._fill[1]);
  this.drawRect(0, 0, width, height);
  this.endFill();
};
