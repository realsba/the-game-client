export default class BinaryStream {
  #offset = 0;
  #dataview = null;
  #uint8Array = null;

  constructor(buffer) {
    if (!buffer) {
      buffer = new ArrayBuffer(32);
    }
    this.#dataview = new DataView(buffer);
    this.#uint8Array = new Uint8Array(buffer);
  }

  get buffer() {
    return this.#dataview.buffer.slice(0, this.#offset);
  }

  seek(offset) {
    this.#offset = offset;
  }

  readUInt8() {
    return this.#dataview.getUint8(this.#offset++);
  };

  readUInt16() {
    const value = this.#dataview.getUint16(this.#offset);
    this.#offset += 2;
    return value;
  };

  readUInt32() {
    const value = this.#dataview.getUint32(this.#offset);
    this.#offset += 4;
    return value;
  };

  readFloat() {
    const value = this.#dataview.getFloat32(this.#offset);
    this.#offset += 4;
    return value;
  };

  readString() {
    const decoder = new TextDecoder();
    const length = this.readUInt16();
    const value = decoder.decode(this.#dataview.buffer.slice(this.#offset, this.#offset + length));
    this.#offset += length;
    return value;
  };

  writeUInt8(value) {
    this.#dataview.setUint8(this.#offset++, value);
  };

  writeUInt16(value) {
    this.#dataview.setUint16(this.#offset, value);
    this.#offset += 2;
  };

  writeUInt32(value) {
    this.#dataview.setUint32(this.#offset, value);
    this.#offset += 4;
  };

  writeFloat(value) {
    this.#dataview.setFloat32(this.#offset, value);
    this.#offset += 4;
  };

  writeString(value) {
    const encoder = new TextEncoder();
    value = encoder.encode(value);
    this.writeUInt16(value.length);
    this.#uint8Array.set(value, this.#offset);
    this.#offset += value.length;
  };
}
