import * as fs from 'fs'

export default class BinaryReader {
  constructor(data) {
    this.content = Buffer.isBuffer(data) ? data : fs.readFileSync(data)
    this.length = this.content.length
    this.offset = 0
  }

  readInt() {
    const val = this.content.readUInt32LE(this.offset)
    this.offset += 4
    return val
  }

  readeSInt() {
    const val = this.content.readInt32LE(this.offset)
    this.offset += 4
    return val
  }

  readShort() {
    const val = this.content.readUInt16LE(this.offset)
    this.offset += 2
    return val
  }

  readByte() {
    const val = this.content.readUInt8(this.offset)
    this.offset += 1
    return val
  }

  readByteArray(length) {
    const val = this.content.slice(this.offset, this.offset + length)
    this.offset += length
    return val

  }

  readBool() {
    return this.readByte() != 0
  }

  readString(length) {
    return Buffer.from(this.readByteArray(length)).toString()
  }

  skip(length) {
    this.offset += length
  }

  set(offset) {
    this.offset = offset
  }
}
