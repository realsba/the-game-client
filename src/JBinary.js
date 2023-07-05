/* global jBinary */

jBinary.prototype.readUInt8 = function () {
  return this.read('uint8');
};

jBinary.prototype.readUInt16 = function () {
  return this.read('uint16');
};

jBinary.prototype.readUInt32 = function () {
  return this.read('uint32');
};

jBinary.prototype.readFloat = function () {
  return this.read('float');
};

jBinary.prototype.writeUInt8 = function (value) {
  this.write('uint8', value);
};

jBinary.prototype.writeUInt16 = function (value) {
  this.write('uint16', value);
};

jBinary.prototype.writeUInt32 = function (value) {
  this.write('uint32', value);
};
