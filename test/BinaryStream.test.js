import chai from 'chai';
const should = chai.should();

import BinaryStream from '../src/BinaryStream.js';

describe('BinaryStream', () => {
  describe('UInt8', () => {
    it('should return 255', () => {
      const stream = new BinaryStream();
      stream.writeUInt8(255);
      stream.seek(0);
      const x = stream.readUInt8();
      x.should.equal(255);
    });
  });
  describe('UInt16', () => {
    it('should return 65535', () => {
      const stream = new BinaryStream();
      stream.writeUInt16(65535);
      stream.seek(0);
      const x = stream.readUInt16();
      x.should.equal(65535);
    });
  });
  describe('UInt32', () => {
    it('should return 4294967295', () => {
      const stream = new BinaryStream();
      stream.writeUInt32(4294967295);
      stream.seek(0);
      const x = stream.readUInt32();
      x.should.equal(4294967295);
    });
  });
  describe('Float', () => {
    it('should return 3.14159265359', () => {
      const stream = new BinaryStream();
      stream.writeFloat(3.14159265359);
      stream.seek(0);
      const x = stream.readFloat();
      x.should.be.closeTo(3.14159265359, 0.000001);
    });
  });
  describe('String', () => {
    it('should return "ABCDEF$%абвгдеєж12345678"', () => {
      const stream = new BinaryStream(new ArrayBuffer(64));
      stream.writeString('ABCDEF$%абвгдеєж12345678');
      stream.seek(0);
      const x = stream.readString();
      x.should.equal('ABCDEF$%абвгдеєж12345678');
    });
  });
  describe('buffer()', () => {
    it('should shrink result buffer', () => {
      const stream = new BinaryStream(new ArrayBuffer(256));
      stream.writeUInt8(1);
      stream.writeUInt16(2);
      stream.writeUInt32(3);
      stream.writeFloat(4);
      stream.buffer.byteLength.should.equal(11);
    });
  });
  describe('seek()', () => {
    it('should shrink result buffer', () => {
      const stream = new BinaryStream(new ArrayBuffer(256));
      stream.writeUInt8(1);
      stream.writeUInt16(2);
      stream.writeUInt32(3);
      stream.writeFloat(4);
      stream.seek(8);
      stream.buffer.byteLength.should.equal(8);
    });
  });
  describe('constructor', () => {
    it('numeric argument should produce creation of new ArrayBuffer', () => {
      const stream = new BinaryStream(256);
      stream.byteLength.should.equal(256);
      stream.buffer.byteLength.should.equal(0);
    });
  });
});
