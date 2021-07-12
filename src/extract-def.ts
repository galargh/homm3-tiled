import BinaryReader from './binary-reader'
import * as fs from 'fs'
import * as path from 'path'
import * as encode from 'image-encode'

const unsupportedSuffixes = [
  'hota/artifact.def',
  'hota/artifbon.def',
  'hota/bores.def',
  'hota/cprsmall.def',
  'hota/resource.def',
  'hota/secsk32.def',
  'hota/secsk82.def',
  'hota/secskill.def',
  'hota/twcrport.def',
  'hota/un32.def',
  'hota/un44.def',
  'h3sprite/sgtwmta.def',
  'h3sprite/sgtwmtb.def'
]

function extract(inputFile, outputDir) {
  const maskFile = inputFile.replace('.def', '.msk')
  if (unsupportedSuffixes.some(suffix => { return inputFile.endsWith(suffix) })) {
    console.log('UNSUPPORTED FILE:' + inputFile)
    return
  }
  const inputFileName = path.parse(inputFile).base.replace('.def', '')
  outputDir = outputDir + '/' + inputFileName
  if (fs.existsSync(outputDir)) {
    return
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const reader = new BinaryReader(inputFile)
  const kind = reader.readInt()
  reader.skip(8)
  const blocks = reader.readInt()
  const palette = reader.readByteArray(256 * 3)
  const groups = Array(blocks).fill(undefined).map(_ => {
    const id = reader.readInt()
    const entries = reader.readInt()
    reader.skip(8)
    const names = Array(entries).fill(undefined).map(_ => {
      return reader.readString(13).split('\0')[0].toLowerCase()
    })
    const offsets = Array(entries).fill(undefined).map(_ => {
      return reader.readInt()
    })
    return [id, names, offsets]
  })
  var shortDefinition = groups.some(([_1, _2, offsets]) => { 
    return offsets.some(offset => { 
      reader.set(offset)
      return offset + reader.readInt() > reader.length
    }) 
  })
  groups.forEach(([id, names, offsets]) => {
    const outputDirWithId = outputDir + '/' + id
    fs.mkdirSync(outputDirWithId, { recursive: true })
    var tileWidth = 0
    var tileHeight = 0
    const tiles = offsets.map((offset, index) => { return [offset, names[index]] }).map(([offset, name], tileId) => {
      reader.set(offset)
      const size = reader.readInt()
      const format = reader.readInt()
      const fullWidth = reader.readInt()
      const fullHeight = reader.readInt()
      const width = reader.readInt()
      const height = reader.readInt()
      const left = reader.readInt() % fullWidth
      const top = reader.readInt() % fullHeight
      tileWidth = Math.max(tileWidth, fullWidth)
      tileHeight = Math.max(tileHeight, fullHeight)
      var data = []
      switch(format) {
        case 0:
          data = reader.readByteArray(width * height)
          break
        case 1:
          Array(height).fill(undefined).map(_ => { return reader.readInt() }).forEach(dataOffset => {
            reader.set(offset + 32 + dataOffset)
            var widthCovered = 0
            while (widthCovered < width) {
              const code = reader.readByte()
              const span = reader.readByte() + 1
              if (code == 0xff) {
                data.push(...reader.readByteArray(span))
              } else {
                data.push(...Array(span).fill(code))
              }
              widthCovered += span
            }
          })
          break
        case 2:
          Array(height).fill(undefined).map(_ => { return reader.readShort() }).forEach(dataOffset => {
            reader.set(offset + 32 + dataOffset)
            var widthCovered = 0
            while (widthCovered < width) {
              const segment = reader.readByte()
              const code = segment >> 5
              const span = (segment & 0x1f) + 1
              if (code == 7) {
                data.push(...reader.readByteArray(span))
              } else {
                data.push(...Array(span).fill(code))
              }
              widthCovered += span
            }
          })
          break
        case 3:
          Array(height * (width / 32)).fill(undefined).map(_ => { return reader.readShort() }).forEach(dataOffset => {
            reader.set(offset + 32 + dataOffset)
            var widthCovered = 0
            while (widthCovered < 32) {
              const segment = reader.readByte()
              const code = segment >> 5
              const span = (segment & 0x1f) + 1
              if (code == 7) {
                data.push(...reader.readByteArray(span))
              } else {
                data.push(...Array(span).fill(code))
              }
              widthCovered += span
            }
          })
          break
      }
      const imageData = Array(fullWidth * top * 4).fill(0)
      var widthCovered = 0
      data.forEach(index => {
        if (widthCovered == 0) {
          imageData.push(...Array(left * 4).fill(0))
        }
        switch(index) {
          case 0:
            imageData.push(...[0, 0, 0, 0])
            break
          case 1:
            imageData.push(...[0, 0, 0, 0x40])
            break
          case 4:
            imageData.push(...[0, 0, 0, 0x80])
            break
          case 5:
            imageData.push(...[0, 0, 0, 0])
            break
          case 6:
            imageData.push(...[0, 0, 0, 0x80])
            break
          case 7:
            imageData.push(...[0, 0, 0, 0x40])
            break
          default:
            imageData.push(palette[index * 3 + 0])
            imageData.push(palette[index * 3 + 1])
            imageData.push(palette[index * 3 + 2])
            imageData.push(255)
            break
        }
        widthCovered += 1
        if (widthCovered == width) {
          imageData.push(...Array((fullWidth - (left + width)) * 4).fill(0))
          widthCovered = 0
        }
      })
      imageData.push(...Array((fullHeight - (top + height)) * 4).fill(0))
      const pngData = Buffer.from(encode(imageData, [fullWidth, fullHeight], 'png'))
      const imageName = name.replace(/\.[^\.]+$/, '.png')
      fs.writeFileSync(outputDirWithId + '/' + imageName, pngData)
      return {
        "id": tileId,
        "image": id + '/' + imageName,
        "imagewidth": fullWidth,
        "imageheight": fullHeight,
        "properties": {
          "name": "type",
          "type": "int",
          "value": kind
        }
      }
    })
    if (tiles.length > 1) {
      tiles.push(
        {...tiles[0], ...{ 
          "id": tiles.length, 
          "animation": Array(tiles.length).fill(undefined).map((_, tileId) => { return {"duration": 100, "tileid": tileId} })
        }}
      )
    }
    const json = {
      "name": inputFileName + '@' + id,
      "tilecount": tiles.length,
      "tilewidth": tileWidth,
      "tileheight": tileHeight,
      "type": "tileset",
      "tiles": tiles
     }
     fs.writeFileSync(outputDir + '/' + id + '.json', JSON.stringify(json, null, 2))
  })
}

function extractDir(inputDir = 'data/lod', outputDir = 'data/def') {
  const inputFiles = []
  const inputDirs = [inputDir]
  while (inputDirs.length > 0) {
    const dir = inputDirs.pop()
    fs.readdirSync(dir).forEach(file => {
      file = dir + '/' + file
      if (fs.statSync(file).isDirectory()) {
        inputDirs.push(file)
      } else if (file.endsWith('.def')) {
        inputFiles.push(file)
      }
    })
  }
  inputFiles.forEach(inputFile => {
    extract(inputFile, outputDir + '/' + inputFile.slice(inputDir.length + 1).replace('.def', '').toLowerCase())
  })
}

extractDir()
//extract('data/lod/hota/artifact.def', 'test-dir')

module.exports = extract
