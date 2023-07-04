/* global PIXI */

/**
 * @constructor
 * @param {Config} config
 */
function Leaderboard(config) {
  PIXI.Graphics.apply(this);

  var self = this;
  this._theme = config.leaderboard;
  this.onMouseDown = null;

  Object.defineProperties(this, {
    items: {
      set: function (value) {
        items = value;
        update();
      }
    },
    playerId: {
      set: function (value) {
        playerId = value;
        update();
      }
    }
  });

  function update() {
    items.forEach(function (item, i) {
      var label = labels[i];
      var style = playerId == item.id ? 'self' : 'def';
      label.text = sprintf('%1$d: <%3$s>%2$s</%3$s> <mass>%4$s</mass>', i + 1, item['name'], style, item['mass']);
      label.visible = true;
      label.playerId = item.id;
    });
    for (var i=items.length; i<20; ++i) {
      labels[i].visible = false;
    }
    var width = list.width + 16;
    var height = title.height + list.height + 8;
    if (width < 200) {
      width = 200;
    }
    if (_width != width || _height != height) {
      _width = width;
      _height = height;
      self.$resize(width, height);
      title.x = 0.5 * (self.width - title.width);
    }
  }

  var items = [];
  var playerId = 0;
  var title = this.addChild(new PIXI.Text('Leaderboard', this._theme._title));
  title.x = 0.5 * (this.width - title.width);
  title.y = 4;
  var list = this.addChild(new PIXI.Graphics());
  var labels = [];
  for (var i=0; i<20; ++i) {
    var label = list.addChild(new PIXI.MultiStyleText('', this._theme._list));
    labels[i] = label;
    label.interactive = true;
    label.y = labels[i].height * i;
    label.visible = false;
    label.on('mousedown', function (mouse) {
      if (self.onMouseDown) {
        self.onMouseDown(mouse);
      }
    });
  }
  list.x = 8;
  list.y = title.height;
  var _width = 0;
  var _height = 0;
  update();
}

Leaderboard.prototype = Object.create(PIXI.Graphics.prototype);

Leaderboard.prototype.$resize = function (width, height) {
  this.clear();
  this.lineStyle(this._theme._lineStyle[0], this._theme._lineStyle[1], this._theme._lineStyle[2]);
  this.beginFill(this._theme._fill[0], this._theme._fill[1]);
  this.drawRect(0, 0, width, height);
  this.endFill();
};
