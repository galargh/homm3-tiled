import * as fs from 'fs'
import * as path from 'path'
import Format from './enums/Format'

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

interface Tile {
  id: number,
  gid: number,
  def: string
} 

interface ObjectGroup {
  width: number,
  height: number,
  name: string
  type: string,
  visible: boolean,
  x: number,
  y: number
}

interface Property {
  name: string,
  type: string,
  value: any
}

create('data/h3m/Manifest Destiny.json', 'data/tiled')

function create(inputFile: string, outputDir: string) {
  const inputFileName = path.parse(inputFile).base.replace('.json', '')
  outputDir = outputDir + '/' + inputFileName
  /*if (fs.existsSync(outputDir)) {
    return
  }*/
  fs.mkdirSync(outputDir, { recursive: true })
  const map = JSON.parse(fs.readFileSync(inputFile).toString())

  var gid = 0
  const seen: Tile[] = []

  const layers = [{
    name: 'Terrain',
    visible: true,
    start: 0,
    end: map.size * map.size,
    typeKey: 'terrain_type',
    idKey: 'terrain_sprite',
    defs: TERRAIN_DEFS,
    verticalMask: 2,
    horizontalMask: 1,
    z: 0,
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
    z: 0,
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
    z: 0,
  }, {
    name: 'Underground Terrain',
    visible: false,
    start: map.size * map.size,
    end: map.size * map.size * 2,
    typeKey: 'terrain_type',
    idKey: 'terrain_sprite',
    defs: TERRAIN_DEFS,
    verticalMask: 2,
    horizontalMask: 1,
    z: 1,
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
    z: 1,
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
    z: 1,
  }].map((layerDefinition, lid) => {
    const data = map.tiles.slice(layerDefinition.start, layerDefinition.end).map((tile: any) => {
      const def = layerDefinition.defs[tile[layerDefinition.typeKey]]
      const id = tile[layerDefinition.idKey]
      const vm = (tile.mirroring & layerDefinition.verticalMask) == 0 ? 0 : 0x40000000
      const hm = (tile.mirroring & layerDefinition.horizontalMask) == 0 ? 0 : 0x80000000

      if (def == null) {
        return 0
      }
      let t = seen.find(t => t.def == def && t.id == id)
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
      y: 0,
      properties: [{
        "name": "z",
        "type": "int",
        "value": layerDefinition.z
      }]
    }
  })

  var defDir = 'data/def/'
  if (map.format == Format.HOTA) {
    defDir += 'hota'
  } else {
    defDir += 'h3sprite'
  }

  const tilesetOutputFile = outputDir + '/tileset.json'
  fs.mkdirSync(outputDir + '/tileset', { recursive: true })
  const tiles = seen.map(tileDefinition => {
    const file = defDir + '/' + tileDefinition.def + '/' + tileDefinition.def + '/0.json'
    const json = JSON.parse(fs.readFileSync(file).toString())
    const tile = json.tiles.find((tile: any) => { return tile.id == tileDefinition.id })
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

  const defToGID = {} as any
  var oid = 0

  fs.mkdirSync(outputDir + '/objectgroup', { recursive: true })

  const objects = map.object_definitions.map((definition: any) => [definition, map.object_attributes[definition.object_attributes_index]])
  const groups = objects.map(([definition, attributes]: [any, any]) => {
    const baseName = attributes.def.replace('.def', '').toLowerCase()
    const srcDir = defDir + '/' + baseName + '/' + baseName
    const json = JSON.parse(fs.readFileSync(srcDir + '/0.json').toString())
    if (defToGID[baseName] == undefined) {
      tilesets.push({
        firstgid: gid + 1,
        source: 'objectgroup/' + baseName + '.json'
      })
      json.name = json.name.replace('@0', '')
      var  group_object_id = 0
      const objectgroup: ObjectGroup[] = []
      Array(8).fill(undefined).map((_, x) => { return Array(6).fill(undefined).map((_, y) => { return [x, y] }) }).flat().map(([x, y]) => {
        const rx = -(8 - (json.tilewidth / 32) - x) * 32
        const ry = -(6 - (json.tileheight / 32) - y) * 32
        if (attributes.passable[y][x] == 0) {
          group_object_id = group_object_id + 1
          objectgroup.push({
            width: 32,
            height: 32,
            name: "",
            type: "impassable",
            visible: true,
            x: rx,
            y: ry
          })
        }
        if (attributes.active[y][x] == 1) {
          group_object_id = group_object_id + 1
          objectgroup.push({
            width: 32,
            height: 32,
            name: "",
            type: "active",
            visible: true,
            x: rx,
            y: ry
          })
        }
      })
      json.tiles = json.tiles.map((tile: any) => {
        tile.image = tile.image.replace('0/', baseName + '/')
        tile.objectgroup = {
          draworder: "index",
          id: 2,
          name: "",
          objects: objectgroup,
          opacity: 1,
          type: "objectgroup",
          visible: true,
          x: 0,
          y: 0
        }
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
      "x": definition.x * 32 + 32 - json.tilewidth,
      "y": definition.y * 32 + 32,
      "properties": [{
        "name": "z",
        "type": "int",
        "value": definition.z
      }]
    }
  }).reduce((agg: any, object: any) => {
    const key = JSON.stringify(object.properties)
    agg[key] = agg[key] || []
    agg[key].push(object)
    return agg
  }, {})

  layers.push(...Object.keys(groups).map(key => {
    const group = groups[key]
    const properties: Property[] = JSON.parse(key)
    const z: number = (properties.find(property => { return property.name == "z" }) || { value: -1 }).value
    return {
      objects: group,
      width: map.size,
      height: map.size,
      data: undefined,
      id: z + layers.length,
      name: z == 0 ? 'Objects' : 'Underground Objects',
      opacity: 1,
      type: 'objectgroup',
      visible: z == 0,
      x: 0,
      y: 0,
      draworder: 'topdown',
      properties: properties
    }
  }))

  const json = {
    tiledversion: '1.7.0',
    version: '1.6',
    renderorder: 'right-down',
    orientation: 'orthogonal',
    width: map.size,
    height: map.size,
    tilewidth: 32,
    tileheight: 32,
    type: 'map',
    tilesets: tilesets,
    layers: layers,
    nextlayerid: layers.length + 1,
    nextobjectid: oid + 1
  }
  fs.writeFileSync(outputDir + '/map.json', JSON.stringify(json, null, 2))
  
}
