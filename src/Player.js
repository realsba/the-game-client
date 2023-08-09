export default class Player {
  #id = 0;
  #x = 0;
  #y = 0;
  #mass = 0;
  _avatars = new Set();

  constructor(id, x, y) {
    this.#id = id;
    this.#x = x;
    this.#y = y;
  }

  get id() {
    return this.#id;
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  get mass() {
    return this.#mass;
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
      this.#x = 0;
      this.#y = 0;
      this.#mass = 0;
      this._avatars.forEach(avatar => {
        this.#x += avatar._position.x * avatar._mass;
        this.#y += avatar._position.y * avatar._mass;
        this.#mass += avatar._mass;
      });
      this.#x /= this.#mass;
      this.#y /= this.#mass;
    } else {
      const avatar = this._avatars.values().next().value;
      this.#mass = avatar._mass;
      this.#x = avatar._position.x;
      this.#y = avatar._position.y;
    }
  };
}

export class PlayerInfo {
  id;
  name;
  status;

  constructor(id, name, status) {
    this.id = id;
    this.name = name;
    this.status = status;
  }
}
