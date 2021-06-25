const fs = require('fs');
const path = require('path');
const {
  FORMAT
} = require('./constants.js')

const TERRAIN_DEFS = [
  'dirttl',
  'grastl',
  'sandtl',
  'snowtl',
  'swmptl',
  'rougtl',
  'subbtl',
  'lavatl',
  'watrtl',
  'rocktl'
]

const RIVER_DEFS = [
  null,
  'clrrvr',
  'icyrvr',
  'mudrvr',
  'lavrvr'
]

const ROAD_DEFS = [
  null,
  'dirtrd',
  'gravrd',
  'cblord'
]


create('data/h3m/Manifest Destiny.json', 'data/tiled')

function create(inputFile, outputDir) {
  const inputFileName = path.parse(inputFile).base.replace('.json', '')
  outputDir = outputDir + '/' + inputFileName
  /*if (fs.existsSync(outputDir)) {
    return
  }*/
  fs.mkdirSync(outputDir, { recursive: true })
  const map = JSON.parse(fs.readFileSync(inputFile))

  var gid = 0
  const seen = []

  const layers = [{
    name: 'Underground Terrain',
    visible: false,
    start: map.size * map.size,
    end: map.size * map.size * 2,
    typeKey: 'terrain_type',
    idKey: 'terrain_sprite',
    defs: TERRAIN_DEFS,
    verticalMask: 2,
    horizontalMask: 1,
  }, {
    name: 'Underground Rivers',
    visible: false,
    start: map.size * map.size,
    end: map.size * map.size * 2,
    typeKey: 'river_type',
    idKey: 'river_sprite',
    defs: RIVER_DEFS,
    verticalMask: 8,
    horizontalMask: 4,
  }, {
    name: 'Underground Roads',
    visible: false,
    start: map.size * map.size,
    end: map.size * map.size * 2,
    typeKey: 'road_type',
    idKey: 'road_sprite',
    defs: ROAD_DEFS,
    verticalMask: 32,
    horizontalMask: 16,
  }, {
    name: 'Terrain',
    visible: true,
    start: 0,
    end: map.size * map.size,
    typeKey: 'terrain_type',
    idKey: 'terrain_sprite',
    defs: TERRAIN_DEFS,
    verticalMask: 2,
    horizontalMask: 1,
  }, {
    name: 'Rivers',
    visible: true,
    start: 0,
    end: map.size * map.size,
    typeKey: 'river_type',
    idKey: 'river_sprite',
    defs: RIVER_DEFS,
    verticalMask: 8,
    horizontalMask: 4,
  }, {
    name: 'Roads',
    visible: true,
    start: 0,
    end: map.size * map.size,
    typeKey: 'road_type',
    idKey: 'road_sprite',
    defs: ROAD_DEFS,
    verticalMask: 32,
    horizontalMask: 16,
  }].map((layerDefinition, lid) => {
    const data = map.tiles.slice(layerDefinition.start, layerDefinition.end).map(tile => {
      const def = layerDefinition.defs[tile[layerDefinition.typeKey]]
      const id = tile[layerDefinition.idKey]
      const vm = (tile.mirroring & layerDefinition.verticalMask) == 0 ? 0 : 0x40000000
      const hm = (tile.mirroring & layerDefinition.horizontalMask) == 0 ? 0 : 0x80000000

      if (def == null) {
        return 0
      }
      var t = seen.find(t => t.def == def && t.id == id)
      if (t == undefined) {
        gid = gid + 1
        t = { def: def, id: id, gid: gid }
        seen.push(t)
      }
      return (t.gid + vm + hm)
    })
    lid = lid + 1
    return {
      id: lid,
      data: data,
      name: layerDefinition.name,
      type: 'tilelayer',
      visible: layerDefinition.visible,
      width: map.size,
      height: map.size,
      opacity: 1,
      x: 0,
      y: 0
    }
  })

  var defDir = 'data/def/'
  if (map.format == FORMAT.HOTA) {
    defDir += 'hota'
  } else {
    defDir += 'h3sprite'
  }

  const tilesetOutputFile = outputDir + '/tileset.json'
  fs.mkdirSync(outputDir + '/tileset', { recursive: true })
  const tiles = seen.map(tileDefinition => {
    const file = defDir + '/' + tileDefinition.def + '/' + tileDefinition.def + '/0.json'
    const json = JSON.parse(fs.readFileSync(file))
    const tile = json.tiles.find(tile => { return tile.id == tileDefinition.id })
    if (tile == undefined) {
      console.log(file, tileDefinition)
      process.exit(0)
    }
    const src = defDir + '/' + tileDefinition.def + '/' + tileDefinition.def + '/' + tile.image
    tile.image = tile.image.replace('0/', 'tileset/')
    tile.id = tileDefinition.gid - 1
    fs.copyFileSync(src, outputDir + '/' + tile.image)
    return tile
  })
  const tileset = {
    "name": "tileset",
    "tilecount": tiles.length,
    "tilewidth": 32,
    "tileheight": 32,
    "type": "tileset",
    "tiles": tiles
  }
  fs.writeFileSync(tilesetOutputFile, JSON.stringify(tileset, null, 2))

  const tilesets = [{
    firstgid: 1, 
    source: 'tileset.json'
  }]

  const defToGID = {}
  var oid = 0

  fs.mkdirSync(outputDir + '/objectgroup', { recursive: true })

  const objects = map.object_definitions.map(definition => [definition, map.object_attributes[definition.object_attributes_index]])
  const zs = [...new Set(map.object_definitions.map(definition => { return definition.z }))]
  const groups = zs.map(z => {
    return objects.filter(([definition, attributes]) => { return definition.z == z }).map(([definition, attributes]) => {
      if (attributes.object_class_name == 'GARRISON') {
        console.log(attributes, definition)
      }
      const baseName = attributes.def.replace('.def', '').toLowerCase()
      const srcDir = defDir + '/' + baseName + '/' + baseName
      const json = JSON.parse(fs.readFileSync(srcDir + '/0.json'))
      if (defToGID[baseName] == undefined) {
        tilesets.push({
          firstgid: gid + 1,
          source: 'objectgroup/' + baseName + '.json'
        })
        json.name = json.name.replace('@0', '')
        json.tiles = json.tiles.map(tile => {
          tile.image = tile.image.replace('0/', baseName + '/')
          return tile
        })
        fs.writeFileSync(outputDir + '/objectgroup/' + baseName + '.json',  JSON.stringify(json, null, 2))
        fs.mkdirSync(outputDir + '/objectgroup/' + baseName)
        fs.readdirSync(srcDir + '/0').forEach(srcFile => {
          fs.copyFileSync(srcDir + '/0/' + srcFile, outputDir + '/objectgroup/' + baseName + '/' + srcFile)
        })
        gid += json.tilecount
        defToGID[baseName] = gid
      }
      oid = oid + 1
      return {
        "gid": defToGID[baseName],
        "width": json.tilewidth,
        "height": json.tileheight,
        "id": oid,
        "name": baseName + '@' + oid,
        "type": attributes.object_class_name,
        "visible": true,
        "x": definition.x * 32 - json.tilewidth / 2,
        "y": definition.y * 32 + json.tileheight / 2
      }
    })
  })

  layers.push(...groups.map((group, lid) => {
    return {
      objects: group,
      width: map.size,
      height: map.size,
      id: lid + layers.length,
      name: 'Objects ' + lid,
      opacity: 1,
      type: 'objectgroup',
      visible: lid == 0,
      x: 0,
      y: 0,
      draworder: 'topdown',
    }
  }))

  const json = {
    tiledversion: '1.7.0',
    version: '1.6',
    renderorder: 'right-down',
    orientation: 'orthogonal',
    nextlayerid: 0,
    nextobjectid: 0,
    width: map.size,
    height: map.size,
    tilewidth: 32,
    tileheight: 32,
    type: 'map',
    tilesets: tilesets,
    layers: layers/*[
      {
        objects: [],
        width: map.size,
        height: map.size,
        id: 1,
        name: 'terrain',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        x: 0,
        y: 0
      }
    ]*/
  }
  fs.writeFileSync(outputDir + '/map.json', JSON.stringify(json, null, 2))
  
}
