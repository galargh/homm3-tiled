const fs = require('fs');
const path = require('path');
const image_size = require('image-size');
const files =  fs.readdirSync('.').filter(file => file.endsWith('.json'))

files.forEach(file => {
  const name = path.parse(file).name
  const content = fs.readFileSync(file, 'utf8')
  const json = JSON.parse(content)

  json.sequences.forEach(sequence => {
    const group = sequence.group
    const is_double_digit_group = group >= 10
    const tiled_name = is_double_digit_group ? name + '.' + group : name + '.0' + group
    const frames_count = sequence.frames.length
    const is_animated = (frames_count > 1)
    const tiled_count = is_animated ? frames_count + 1 : frames_count
    const properties = [
      {
        "name": "format",
        "type": "int",
        "value": json.format
      },
      {
        "name": "type",
        "type": "int",
        "value": json.type
      }
    ]
    var animation_dimensions
    var animation_image
    var tiled_tiles = sequence.frames.map((image_file, index) => {
      animation_dimensions = image_size(image_file)
      animation_image = image_file
      return {
        "id": index,
        "image": image_file,
        "imageheight": animation_dimensions.height,
        "imagewidth": animation_dimensions.width,
        "properties": properties
      }
    })

    if (is_animated) {
      const animation = {
        "animation": Array(frames_count).fill().map((_, index) => { return {"duration": 100, "tileid": index} }),
        "id": frames_count,
        "image": animation_image,
        "imageheight": animation_dimensions.height,
        "imagewidth": animation_dimensions.width,
        "properties": properties
      }
      tiled_tiles.push(animation)
    }

    const tiled = {
     "name": tiled_name,
     "tilecount": tiled_count,
     "tileheight": animation_dimensions.height,
     "tilewidth": animation_dimensions.width,
     "type": "tileset",
     "tiles": tiled_tiles
    }

    fs.writeFileSync(tiled_name + '.tiled.json', JSON.stringify(tiled, null, 2))
  })
})
