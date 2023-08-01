export default class Player {
  _id = 0;
  _x = 0;
  _y = 0;
  _mass = 0;
  _avatars = new Set();

  get id() {
    return this._id;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get mass() {
    return this._mass;
  }

  addAvatar(avatar) {
    this._avatars.add(avatar);
  };

  removeAvatar(avatar) {
    this._avatars.delete(avatar);
  };

  clearAvatars() {
    this._avatars.clear();
  };

  update() {
    const size = this._avatars.size;
    if (!size) {
      return;
    }
    if (size > 1) {
      this._x = 0;
      this._y = 0;
      this._mass = 0;
      this._avatars.forEach(avatar => {
        this._x += avatar._position._x * avatar._mass;
        this._y += avatar._position._y * avatar._mass;
        this._mass += avatar._mass;
      });
      this._x /= this._mass;
      this._y /= this._mass;
    } else {
      const avatar = this._avatars.values().next().value;
      this._mass = avatar._mass;
      this._x = avatar._position._x;
      this._y = avatar._position._y;
    }
  };
}

export class PlayerInfo {
  constructor(id, name, status) {
    this.id = id;
    this.name = name;
    this.status = status;
  }
}
