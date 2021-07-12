import BinaryReader from './binary-reader'
import * as fs from 'fs'
import * as zlib from 'zlib'
import * as encode from 'image-encode'

function extract(inputFile, outputDir) {
  const reader = new BinaryReader(inputFile)
  if (fs.existsSync(outputDir)) { return }
  fs.mkdirSync(outputDir, { recursive: true })
  reader.set(8)
  const length = reader.readInt()
  reader.set(92)
  const  outputFiles = Array(length).fill(undefined).map(_ => {
    const name = reader.readString(16).split('\0')[0].toLowerCase()
    const offset = reader.readInt()
    const size = reader.readInt()
    reader.skip(4)
    const csize = reader.readInt()
    return [name, offset, size, csize]
  }).map(object => {
    const [name, offset, size, csize] = object
    reader.set(offset)
    var data
    if (csize != 0) {
      data = zlib.unzipSync(reader.readByteArray(csize)) 
    } else {
      data = reader.readByteArray(size)
    }
    if (name.endsWith('.pcx')) {
      const imageReader = new BinaryReader(data)
      const imageSize = imageReader.readInt()
      const imageWidth = imageReader.readInt()
      const imageHeight = imageReader.readInt()
      const imageData = []
      if (imageSize == imageWidth * imageHeight) {
        const palette = imageReader.readByteArray(imageWidth * imageHeight)
        imageReader.readByteArray(imageWidth * imageHeight).forEach(index => {
          imageData.push(palette[index * 3 + 0])
          imageData.push(palette[index * 3 + 1])
          imageData.push(palette[index * 3 + 2])
          imageData.push(255)
        })
      } else {
        imageReader.readByteArray(imageWidth * imageHeight * 3).forEach((colour, index) => {
          imageData.push(colour)
          if (index % 3 == 0) {
            imageData.push(255)
          }
        })
      }
      const pngData = Buffer.from(encode(imageData, [imageWidth, imageHeight], 'png'))
      return [name.replace('.pcx', '.png'), pngData]
    } else {
      return [name, data]
    }
  }).forEach(([name, data]) =>
    fs.writeFileSync(outputDir + '/' + name, data)
  )
}

function extractDir(inputDir = process.env.HOMM3_HOME + '/Data', outputDir = 'data/lod') {
  const inputFiles = fs.readdirSync(inputDir).filter(inputFile => inputFile.endsWith('.lod'))
  inputFiles.forEach(inputFile => {
    extract(inputDir + '/' + inputFile, outputDir + '/' + inputFile.replace('.lod', '').toLowerCase())
  })
}
