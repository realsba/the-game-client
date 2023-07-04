/* global PIXI */

/** @constructor */
function Player() {
  this._id = 0;
  this._x = 0;
  this._y = 0;
  this._mass = 0;
  this._avatars = new Set();
}

/**
 * @param {Avatar} avatar
 */
Player.prototype.addAvatar = function (avatar) {
  this._avatars.add(avatar);
};

/**
 * @param {Avatar} avatar
 */
Player.prototype.removeAvatar = function (avatar) {
  this._avatars.delete(avatar);
};

Player.prototype.clearAvatars = function () {
  this._avatars.clear();
};

Player.prototype.$update = function () {
  var size = this._avatars.size;
  if (!size) {
    return;
  }
  if (size > 1) {
    this._x = 0;
    this._y = 0;
    this._mass = 0;
    this._avatars.forEach(function (avatar) {
      this._x += avatar._position._x * avatar._mass;
      this._y += avatar._position._y * avatar._mass;
      this._mass += avatar._mass;
    }, this);
    this._x /= this._mass;
    this._y /= this._mass;
  } else {
    var avatar = this._avatars.values().next().value;
    this._mass = avatar._mass;
    this._x = avatar._position._x;
    this._y = avatar._position._y;
  }
};
