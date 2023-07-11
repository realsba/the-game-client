import Panel from './ui/Panel';
import { Graphics, Text } from 'pixi.js';
import { delayed_call } from './utils';

export default class Leaderboard extends Panel {
  _items = [];
  _playerId = 0;
  _title = this.addChild(new Text('Leaderboard'));
  _list = this.addChild(new Graphics());
  _labels = {};
  _onMouseDown = null;

  constructor(view, config) {
    super(view, config);

    this._title.style = this._config.title;
    this._title.x = 0.5 * (this.width - this._title.width);
    this._title.y = 4;

    for (let i=0; i<20; ++i) {
      let label = this._list.addChild(new Text('', this._config.list.def));
      this._labels[i] = label;
      label.eventMode = 'static';
      label.y = this._labels[i].height * i;
      label.visible = false;
      label.on('mousedown', (mouse) => {
        if (this._onMouseDown) {
          this._onMouseDown(mouse);
        }
      });
    }
    this._list.x = 8;
    this._list.y = this._title.height;

    this.#doUpdate();
  }

  set onMouseDown(value) {
    this._onMouseDown = value;
  }

  set items(value) {
    this._items = value;
    this.update();
  }

  set playerId(value) {
    this._playerId = value;
    this.update();
  }

  update = delayed_call(() => this.#doUpdate());

  #doUpdate() {
    this._items.forEach((item, i) => {
      let label = this._labels[i];
      let style = this._playerId === item.id ? 'self' : 'def';
      // TODO: use multi style
      //label.text = sprintf('%1$d: <%3$s>%2$s</%3$s> <mass>%4$s</mass>', i + 1, item['name'], style, item['mass']);
      label.text = `${i + 1} ${item.name} ${item.mass}`;
      label.visible = true;
      label.playerId = item.id;
    });
    for (let i=this._items.length; i<20; ++i) {
      this._labels[i].visible = false;
    }
    let width = this._list.width + 16;
    let height = this._title.height + this._list.height + 8;
    if (width < 200) {
      width = 200;
    }
    if (this.resize(width, height)) {
      this._title.x = 0.5 * (this.width - this._title.width);
    }
  }
}
