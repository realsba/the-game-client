export default class BinaryStream {
  _offset = 0;
  _dataview = null;
  _uint8Array = null;

  constructor(buffer) {
    this._dataview = new DataView(buffer);
    this._uint8Array = new Uint8Array(buffer);
  }

  get buffer() {
    return this._dataview.buffer.slice(0, this._offset);
  }

  readUInt8() {
    return this._dataview.getUint8(this._offset++);
  };

  readUInt16() {
    const value = this._dataview.getUint16(this._offset);
    this._offset += 2;
    return value;
  };

  readUInt32() {
    const value = this._dataview.getUint32(this._offset);
    this._offset += 4;
    return value;
  };

  readFloat() {
    const value = this._dataview.getFloat32(this._offset);
    this._offset += 4;
    return value;
  };

  readString() {
    const decoder = new TextDecoder();
    const length = this.readUInt16();
    const value = decoder.decode(this._dataview.buffer.slice(this._offset, this._offset + length));
    this._offset += length;
    return value;
  };

  writeUInt8(value) {
    this._dataview.setUint8(this._offset++, value);
  };

  writeUInt16(value) {
    this._dataview.setUint16(this._offset, value);
    this._offset += 2;
  };

  writeUInt32(value) {
    this._dataview.setUint32(this._offset, value);
    this._offset += 4;
  };

  writeFloat(value) {
    this._dataview.setFloat32(this._offset, value);
    this._offset += 4;
  };

  writeString(value) {
    const encoder = new TextEncoder();
    value = encoder.encode(value);
    this.writeUInt16(value.length);
    this._uint8Array.set(value, this._offset);
    this._offset += value.length;
  };
}
