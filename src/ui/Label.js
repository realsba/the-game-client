import {List} from "@pixi/ui";

export default class Label extends List {
  constructor(options) {
    super(options);
  }

  getChildrenWidth() {
    return this.children.reduce((acc, item) => acc + item.width + this.elementsMargin, -this.elementsMargin);
  }
}
