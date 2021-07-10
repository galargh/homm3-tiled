const fs = require('fs');
const zlib = require('zlib')
const path = require('path');
const MapReader = require('./map-reader.js')
const {
  FORMAT,
  SPECIAL_WIN_CONDITION,
  SPECIAL_LOSS_CONDITION,
  OBJECT_CLASS,
  REWARD_TYPE
} = require('./constants.js')

function extract(inputFile, outputDir) {
  const inputFileName = path.parse(inputFile).base.replace('.h3m', '')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputFile = outputDir + '/' + inputFileName + '.json'
  if (fs.existsSync(outputFile)) {
    return
  }
  const map = {}
  const reader = new MapReader(zlib.unzipSync(fs.readFileSync(inputFile)))
  map.format = reader.readInt()
  map.has_hero = reader.readBool()
  map.size = reader.readInt()
  map.has_second_level = reader.readBool()
  map.name = reader.readString(reader.readInt())
  map.description = reader.readString(reader.readInt())
  map.difficulty = reader.readByte()

  if (map.format >= FORMAT.AB) {
    map.mastery_cap = reader.readByte()
  }

  map.players = Array(8).fill().map(_ => {
    const player = {}
    player.can_be_human = reader.readBool()
    player.can_be_computer = reader.readBool()
    player.behavior = reader.readByte()
    if (map.format >= FORMAT.SOD) {
      player.allowed_alignments = reader.readByte()
    }
    player.town_types = reader.readByte()
    if (map.format >= FORMAT.AB) {
      player.town_conflux = reader.readByte()
    }
    player.unknown = reader.readByte()
    player.has_main_town = reader.readBool()

    if (player.has_main_town) {
      if (map.format >= FORMAT.AB) {
        player.starting_town_create_hero = reader.readByte()
        player.starting_town_type = reader.readByte()
      }
      player.starting_town_xpos = reader.readByte()
      player.starting_town_ypos = reader.readByte()
      player.starting_town_zpos = reader.readByte()
    }

    player.starting_hero_is_random = reader.readBool()
    player.starting_hero_type = reader.readByte()

    if (player.starting_hero_type != 0xFF || map.format >= FORMAT.AB) {
      player.starting_hero_face = reader.readByte()
      player.starting_hero_name = reader.readString(reader.readInt())
    }
    return player
  })

  const special_win_condition = {}
  special_win_condition.id = reader.readByte()

  switch(special_win_condition.id) {
    case SPECIAL_WIN_CONDITION.ACQUIRE_ARTIFACT:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      if (map.format == FORMAT.ROE) {
        special_win_condition.type = reader.readByte()
      } else {
        special_win_condition.type = reader.readShort()
      }
      break
    case SPECIAL_WIN_CONDITION.ACCUMULATE_CREATURES:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      if (map.format == FORMAT.ROE) {
        special_win_condition.type = reader.readByte()
      } else {
        special_win_condition.type = reader.readShort()
      }
      special_win_condition.amount = reader.readInt()
      break
    case SPECIAL_WIN_CONDITION.ACCUMULATE_RESOURCES:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      /*****************************
       * type:                     *
       * 0 - Wood     4 - Crystal  *
       * 1 - Mercury  5 - Gems     *
       * 2 - Ore      6 - Gold     *
       * 3 - Sulfur                *
       *****************************/
      special_win_condition.type = reader.readByte()
      special_win_condition.amount = reader.readInt()
      break
    case SPECIAL_WIN_CONDITION.UPGRADE_TOWN:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      special_win_condition.hall_level = reader.readByte()
      special_win_condition.castle_level = reader.readByte()
      break
    case SPECIAL_WIN_CONDITION.BUILD_GRAIL:
    case SPECIAL_WIN_CONDITION.DEFEAT_HERO:
    case SPECIAL_WIN_CONDITION.CAPTURE_TOWN:
    case SPECIAL_WIN_CONDITION.DEFEAT_MONSTER:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      break
    case SPECIAL_WIN_CONDITION.FLAG_DWELLINGS:
    case SPECIAL_WIN_CONDITION.FLAG_MINES:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      break
    case SPECIAL_WIN_CONDITION.TRANSPORT_ARTIFACT:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.type = reader.readByte()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      break
  }
  map.special_win_condition = special_win_condition

  const special_loss_condition = {}
  special_loss_condition.id = reader.readByte()

  switch(special_loss_condition.id) {
    case SPECIAL_LOSS_CONDITION.LOSE_TOWN:
    case SPECIAL_LOSS_CONDITION.LOSE_HERO:
      special_loss_condition.xpos = reader.readByte()
      special_loss_condition.ypos = reader.readByte()
      special_loss_condition.zpos = reader.readByte()
      break
    case SPECIAL_LOSS_CONDITION.TIME:
      special_loss_condition.days = reader.readShort()
      break
  }
  map.special_loss_condition = special_loss_condition

  if (reader.readBool()) {
    map.teams = Array(8).fill().map(_ => { return reader.readByte() })
  }
  if (map.format == FORMAT.ROE) {
    map.available_heroes = Array(16).fill().map(_ => { return reader.readByte() })
  } else {
    map.available_heroes = Array(20).fill().map(_ => { return reader.readByte() })
  }
  if (map.format >= FORMAT.AB) {
    map.placeholder_heroes_count = reader.readInt()
  }
  if (map.format >= FORMAT.SOD) {
    map.custom_heroes = Array(reader.readByte()).fill().map(_ => {
      const custom_hero = {}
      custom_hero.type = reader.readByte()
      custom_hero.face = reader.readByte()
      custom_hero.name = reader.readString(reader.readInt())
      custom_hero.allowed_players = reader.readByte()
      return custom_hero
    })
  }
  map.reserved = Array(31).fill().map(_ => { return reader.readByte() })
  if (map.format == FORMAT.AB) {
    map.available_artifacts = Array(17).fill().map(_ => { return reader.readByte() })
  } else if (map.format >= FORMAT.SOD) {
    map.available_artifacts = Array(18).fill().map(_ => { return reader.readByte() })
  }
  if (map.format >= FORMAT.SOD) {
    map.available_spells = Array(9).fill().map(_ => { return reader.readByte() })
    map.available_skills = Array(4).fill().map(_ => { return reader.readByte() })
  }
  map.rumors = Array(reader.readInt()).fill().map(_ => {
    const rumor = {}
    rumor.name = reader.readString(reader.readInt())
    rumor.description = reader.readString(reader.readInt())
    return rumor
  })
  if (map.format >= FORMAT.SOD) {
    map.hero_settings = Array(156).fill().map(_ => {
      const hero = {}
      if (reader.readBool()) {
        if (reader.readBool()) {
          hero.experience = reader.readInt()
        }
        // face?
        if (reader.readBool()) {
          hero.secondary_skills = reader.readSecondarySkills()
        }
        if (reader.readBool()) {
          hero.artifacts = reader.readArtifacts()
          hero.backpack = Array(reader.readShort()).fill().map(_ => { return reader.readArtifact(map) })
        }
        if (reader.readBool()) {
          hero.biography = reader.readString(reader.readInt())
        }
        hero.gender = reader.readByte()
        if (reader.readBool()) {
          hero.spells = Array(9).fill().map(_ => { return reader.readByte() })
        }
        if (reader.readBool()) {
          hero.primary_skills = reader.readPrimarySkills()
        }
      }
      return hero
    })
  }
  const tiles_count = map.has_second_level ? map.size * map.size * 2 : map.size * map.size
  map.tiles = Array(tiles_count).fill().map(_ => {
    const tile = {}
    /*
    T_DIRT,
    T_SAND,
    T_GRASS,
    T_SNOW,
    T_SWAMP,
    T_ROUGH,
    T_SUBTERRANEAN,
    T_LAVA,
    T_WATER,
    T_ROCK
    */
    tile.terrain_type = reader.readByte()
    tile.terrain_sprite = reader.readByte()
    tile.river_type = reader.readByte()
    tile.river_sprite = reader.readByte()
    tile.road_type = reader.readByte()
    tile.road_sprite = reader.readByte()
    tile.mirroring = reader.readByte()
    return tile
  })

  map.object_attributes = Array(reader.readInt()).fill().map(_ => {
    const object_attribute = {}
    object_attribute.def = reader.readString(reader.readInt())
    // The passable and active arrays are bitfields representing an 8x6 tile
    // region where bit 1 marks passable and bit 0 impassable. Counting goes
    // from left to right downwards towards the bottom right corner. This means
    // that first bit in passable[0] is [x-7, y-5] from bottom right corner and
    // last bit in passable[6] is the bottom right corner.
    object_attribute.passable = Array(6).fill().map(_ => {
      const byte = reader.readByte()
      return Array(8).fill().map((_, bit) => { return byte & (1 << bit) ? 1 : 0 })
    })
    object_attribute.active =  Array(6).fill().map(_ => {
      const byte = reader.readByte()
      return Array(8).fill().map((_, bit) => { return byte & (1 << bit) ? 1 : 0 })
    })
    object_attribute.allowed_landscapes = reader.readShort()
    object_attribute.landscape_group = reader.readShort()
    object_attribute.object_class = reader.readInt()
    object_attribute.object_class_name = Object.keys(OBJECT_CLASS).find(key => { return OBJECT_CLASS[key] == object_attribute.object_class })
    object_attribute.object_number = reader.readInt()
    // 1 - towns  2 - monsters  5 - treasure
    // 3 - heroes 4 - artifacts
    object_attribute.object_group = reader.readByte()
    object_attribute.above = reader.readByte()
    object_attribute.unknown = Array(16).fill().map(_ => { return reader.readByte() })
    return object_attribute
  })

  // TODO: https://github.com/potmdehex/homm3tools/blob/5687f581a4eb5e7b0e8f48794d7be4e3b0a8cc8b/h3m/h3mlib/h3m_parsing/parse_oa.c#L108

  const object_definitions = Array(reader.readInt()).fill().map(_ => {
    const object_definition = {}
    object_definition.x = reader.readByte()
    object_definition.y = reader.readByte()
    object_definition.z = reader.readByte()
    object_definition.object_attributes_index = reader.readInt()
    object_definition.unknown = Array(5).fill().map(_ => { return reader.readByte() })

    const object_attribute = map.object_attributes[object_definition.object_attributes_index]
    const object_class = object_attribute.object_class

    switch(object_class) {
      case OBJECT_CLASS.HERO_PLACEHOLDER:
        object_definition.object_class_group_name = 'HERO_PLACEHOLDER'
        object_definition.owner = reader.readByte()
        object_definition.type = reader.readByte()
        if (object_definition.type == 0xFF) {
          object_definition.power_rating = reader.readByte()
        }
        break
      case OBJECT_CLASS.QUEST_GUARD:
        object_definition.object_class_group_name = 'QUEST_GUARD'
        object_definition.quest = reader.readQuest(map)
        break
      case OBJECT_CLASS.EVENT:
      case OBJECT_CLASS.PANDORAS_BOX:
        object_definition.object_class_group_name = 'EVENT'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill().map(_ => { return reader.readByte() })
        }
        object_definition.experience = reader.readInt()
        object_definition.morale = reader.readByte()
        object_definition.luck = reader.readByte()
        object_definition.morale = reader.readByte()
        object_definition.resources = Array(7).fill().map(_ => { return reader.readInt() })
        object_definition.primary_skills = reader.readPrimarySkills()
        object_definition.secondary_skills = reader.readSecondarySkills()
        object_definition.artifacts = Array.fill(reader.readByte()).map(_ => { return reader.readArtifact(map) })
        object_definition.spells = Array.fill(reader.readByte()).map(_ => { return reader.readByte() })
        object_definition.creatures = Array.fill(reader.readByte()).map(_ => { reader.readCreature(map) })
        object_definition.unknown = Array(8).fill().map(_ => { return reader.readByte() })
        if (object_class == OBJECT_CLASS.EVENT) {
          object_definition.applies_to_players = reader.readByte()
          object_definition.applies_to_computer = reader.readByte()
          object_definition.cancel_after_visit = reader.readByte()
          object_definition.unknown1 = Array(4).fill().map(_ => { return reader.readByte() })
        }
        break
      case OBJECT_CLASS.SIGN:
      case OBJECT_CLASS.OCEAN_BOTTLE:
        object_definition.object_class_group_name = 'SIGN'
        object_definition.message = reader.readString(reader.readInt())
        object_definition.unknown = Array(4).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.GARRISON:
      case OBJECT_CLASS.GARRISON2:
        object_definition.object_class_group_name = 'GARRISON'
        object_definition.owner = reader.readInt()
        object_definition.creatures = Array(7).fill().map(_ => { reader.readCreature(map) })
        if (map.format >= FORMAT.AB) {
          object_definition.removable_units = reader.readByte()
        }
        object_definition.unknown = Array(8).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.GRAIL:
        object_definition.object_class_group_name = 'GRAIL'
        object_definition.allowable_radius = reader.readInt()
        break
      case OBJECT_CLASS.DWELLING:
      case OBJECT_CLASS.DWELLING2:
      case OBJECT_CLASS.LIGHTHOUSE:
      case OBJECT_CLASS.RESOURCE_GENERATOR:
      case OBJECT_CLASS.SHIPYARD:
      case OBJECT_CLASS.ABANDONED_MINE2:
      case OBJECT_CLASS.CREATURE_GENERATOR1:
      case OBJECT_CLASS.CREATURE_GENERATOR2:
      case OBJECT_CLASS.CREATURE_GENERATOR3:
      case OBJECT_CLASS.CREATURE_GENERATOR4:
      case OBJECT_CLASS.LIGHTHOUSE:
      case OBJECT_CLASS.MINE:
      case OBJECT_CLASS.SHIPYARD:
      case OBJECT_CLASS.ABANDONED_MINE:
        object_definition.object_class_group_name = 'DWELLING'
        object_definition.owner = reader.readInt()
        break
      case OBJECT_CLASS.BOAT:
      case OBJECT_CLASS.CLOVER_FIELD:
      case OBJECT_CLASS.EVIL_FOG:
      case OBJECT_CLASS.FAVORABLE_WINDS:
      case OBJECT_CLASS.FIERY_FIELDS:
      case OBJECT_CLASS.HOLY_GROUNDS:
      case OBJECT_CLASS.LUCID_POOLS:
      case OBJECT_CLASS.MAGIC_CLOUDS:
      case OBJECT_CLASS.ROCKLANDS:
      case OBJECT_CLASS.CURSED_GROUND2:
      case OBJECT_CLASS.MAGIC_PLAINS2:
      case OBJECT_CLASS.PASSABLE_139:
      case OBJECT_CLASS.PASSABLE_141:
      case OBJECT_CLASS.PASSABLE_142:
      case OBJECT_CLASS.PASSABLE_144:
      case OBJECT_CLASS.PASSABLE_145:
      case OBJECT_CLASS.PASSABLE_146:
      case OBJECT_CLASS.HOLE:
      case OBJECT_CLASS.CURSED_GROUND1:
      case OBJECT_CLASS.MAGIC_PLAINS1:
      case OBJECT_CLASS.PASSABLE_KELP:
      case OBJECT_CLASS.PASSABLE_KELP2:
      case OBJECT_CLASS.PASSABLE_HOLE2:
      case OBJECT_CLASS.NONE_0:
      case OBJECT_CLASS.BLANK_40:
      case OBJECT_CLASS.IMPASSABLE_BRUSH:
      case OBJECT_CLASS.IMPASSABLE_BUSH:
      case OBJECT_CLASS.IMPASSABLE_CACTUS:
      case OBJECT_CLASS.IMPASSABLE_CANYON:
      case OBJECT_CLASS.IMPASSABLE_CRATER:
      case OBJECT_CLASS.IMPASSABLE_DEADVEGETATION:
      case OBJECT_CLASS.IMPASSABLE_FLOWERS:
      case OBJECT_CLASS.IMPASSABLE_FROZENLIKE:
      case OBJECT_CLASS.IMPASSABLE_HEDGE:
      case OBJECT_CLASS.IMPASSABLE_HILL:
      case OBJECT_CLASS.IMPASSABLE_LAKE:
      case OBJECT_CLASS.IMPASSABLE_LAVAFLOW:
      case OBJECT_CLASS.IMPASSABLE_LAVALAKE:
      case OBJECT_CLASS.IMPASSABLE_MUSHROOMS:
      case OBJECT_CLASS.IMPASSABLE_LOG:
      case OBJECT_CLASS.IMPASSABLE_MANDRAKE:
      case OBJECT_CLASS.IMPASSABLE_MOSS:
      case OBJECT_CLASS.IMPASSABLE_MOUND:
      case OBJECT_CLASS.IMPASSABLE_MOUNTAIN:
      case OBJECT_CLASS.IMPASSABLE_OAKTREES:
      case OBJECT_CLASS.IMPASSABLE_OUTCROPPING:
      case OBJECT_CLASS.IMPASSABLE_PINETREES:
      case OBJECT_CLASS.IMPASSABLE_PLANT:
      case OBJECT_CLASS.IMPASSABLE_RIVERDELTA:
      case OBJECT_CLASS.IMPASSABLE_ROCK:
      case OBJECT_CLASS.IMPASSABLE_SANDDUNE:
      case OBJECT_CLASS.IMPASSABLE_SANDPIT:
      case OBJECT_CLASS.IMPASSABLE_SHRUB:
      case OBJECT_CLASS.IMPASSABLE_SKULL:
      case OBJECT_CLASS.IMPASSABLE_STALAGMITE:
      case OBJECT_CLASS.IMPASSABLE_STUMP:
      case OBJECT_CLASS.IMPASSABLE_TARPIT:
      case OBJECT_CLASS.IMPASSABLE_TREES:
      case OBJECT_CLASS.IMPASSABLE_VINE:
      case OBJECT_CLASS.IMPASSABLE_VOLCANICVENT:
      case OBJECT_CLASS.IMPASSABLE_VOLCANO:
      case OBJECT_CLASS.IMPASSABLE_WILLOWTREES:
      case OBJECT_CLASS.IMPASSABLE_YUCCATREES:
      case OBJECT_CLASS.IMPASSABLE_REEF:
      case OBJECT_CLASS.IMPASSABLE_BRUSH2:
      case OBJECT_CLASS.IMPASSABLE_BUSH2:
      case OBJECT_CLASS.IMPASSABLE_CACTUS2:
      case OBJECT_CLASS.IMPASSABLE_CANYON2:
      case OBJECT_CLASS.IMPASSABLE_CRATER2:
      case OBJECT_CLASS.IMPASSABLE_DEADVEGETATION2:
      case OBJECT_CLASS.IMPASSABLE_FLOWERS2:
      case OBJECT_CLASS.IMPASSABLE_FROZENLIKE2:
      case OBJECT_CLASS.IMPASSABLE_HEDGE2:
      case OBJECT_CLASS.IMPASSABLE_HILL2:
      case OBJECT_CLASS.IMPASSABLE_LAKE2:
      case OBJECT_CLASS.IMPASSABLE_LAVAFLOW2:
      case OBJECT_CLASS.IMPASSABLE_LAVALAKE2:
      case OBJECT_CLASS.IMPASSABLE_MUSHROOMS2:
      case OBJECT_CLASS.IMPASSABLE_LOG2:
      case OBJECT_CLASS.IMPASSABLE_MANDRAKE2:
      case OBJECT_CLASS.IMPASSABLE_MOSS2:
      case OBJECT_CLASS.IMPASSABLE_MOUND2:
      case OBJECT_CLASS.IMPASSABLE_MOUNTAIN2:
      case OBJECT_CLASS.IMPASSABLE_OAKTREES2:
      case OBJECT_CLASS.IMPASSABLE_OUTCROPPING2:
      case OBJECT_CLASS.IMPASSABLE_PINETREES2:
      case OBJECT_CLASS.IMPASSABLE_PLANT2:
      case OBJECT_CLASS.IMPASSABLE_RIVERDELTA2:
      case OBJECT_CLASS.IMPASSABLE_ROCK2:
      case OBJECT_CLASS.IMPASSABLE_SANDDUNE2:
      case OBJECT_CLASS.IMPASSABLE_SANDPIT2:
      case OBJECT_CLASS.IMPASSABLE_SHRUB2:
      case OBJECT_CLASS.IMPASSABLE_SKULL2:
      case OBJECT_CLASS.IMPASSABLE_STALAGMITE2:
      case OBJECT_CLASS.IMPASSABLE_STUMP2:
      case OBJECT_CLASS.IMPASSABLE_TARPIT2:
      case OBJECT_CLASS.IMPASSABLE_TREES2:
      case OBJECT_CLASS.IMPASSABLE_VINE2:
      case OBJECT_CLASS.IMPASSABLE_VOLCANICVENT2:
      case OBJECT_CLASS.IMPASSABLE_VOLCANO2:
      case OBJECT_CLASS.IMPASSABLE_WILLOWTREES2:
      case OBJECT_CLASS.IMPASSABLE_YUCCATREES2:
      case OBJECT_CLASS.IMPASSABLE_REEF2:
      case OBJECT_CLASS.IMPASSABLE_DESERTHILLS:
      case OBJECT_CLASS.IMPASSABLE_DIRTHILLS:
      case OBJECT_CLASS.IMPASSABLE_GRASSHILLS:
      case OBJECT_CLASS.IMPASSABLE_ROUGHHILLS:
      case OBJECT_CLASS.IMPASSABLE_SUBTERRANEANROCKS:
      case OBJECT_CLASS.IMPASSABLE_SWAMPFOLIAGE:
      case OBJECT_CLASS.ALTAR_OF_SACRIFICE:
      case OBJECT_CLASS.ANCHOR_POINT:
      case OBJECT_CLASS.ARENA:
      case OBJECT_CLASS.BLACK_MARKET:
      case OBJECT_CLASS.CARTOGRAPHER:
      case OBJECT_CLASS.BUOY:
      case OBJECT_CLASS.SWAN_POND:
      case OBJECT_CLASS.COVER_OF_DARKNESS:
      case OBJECT_CLASS.CREATURE_BANK:
      case OBJECT_CLASS.CORPSE:
      case OBJECT_CLASS.MARLETTO_TOWER:
      case OBJECT_CLASS.DERELICT_SHIP:
      case OBJECT_CLASS.DRAGON_UTOPIA:
      case OBJECT_CLASS.EYE_OF_MAGI:
      case OBJECT_CLASS.FAERIE_RING:
      case OBJECT_CLASS.FOUNTAIN_OF_FORTUNE:
      case OBJECT_CLASS.FOUNTAIN_OF_YOUTH:
      case OBJECT_CLASS.GARDEN_OF_REVELATION:
      case OBJECT_CLASS.HILL_FORT:
      case OBJECT_CLASS.HUT_OF_MAGI:
      case OBJECT_CLASS.IDOL_OF_FORTUNE:
      case OBJECT_CLASS.LEAN_TO:
      case OBJECT_CLASS.LIBRARY_OF_ENLIGHTENMENT:
      case OBJECT_CLASS.SCHOOL_OF_MAGIC:
      case OBJECT_CLASS.MAGIC_SPRING:
      case OBJECT_CLASS.MAGIC_WELL:
      case OBJECT_CLASS.MERCENARY_CAMP:
      case OBJECT_CLASS.MERMAID:
      case OBJECT_CLASS.MYSTICAL_GARDEN:
      case OBJECT_CLASS.OASIS:
      case OBJECT_CLASS.OBELISK:
      case OBJECT_CLASS.REDWOOD_OBSERVATORY:
      case OBJECT_CLASS.PILLAR_OF_FIRE:
      case OBJECT_CLASS.STAR_AXIS:
      case OBJECT_CLASS.RALLY_FLAG:
      case OBJECT_CLASS.BORDERGUARD:
      case OBJECT_CLASS.KEYMASTER:
      case OBJECT_CLASS.REFUGEE_CAMP:
      case OBJECT_CLASS.SANCTUARY:
      case OBJECT_CLASS.CRYPT:
      case OBJECT_CLASS.SHIPWRECK:
      case OBJECT_CLASS.SIRENS:
      case OBJECT_CLASS.STABLES:
      case OBJECT_CLASS.TAVERN:
      case OBJECT_CLASS.TEMPLE:
      case OBJECT_CLASS.DEN_OF_THIEVES:
      case OBJECT_CLASS.TRADING_POST:
      case OBJECT_CLASS.LEARNING_STONE:
      case OBJECT_CLASS.TREE_OF_KNOWLEDGE:
      case OBJECT_CLASS.UNIVERSITY:
      case OBJECT_CLASS.WAGON:
      case OBJECT_CLASS.WAR_MACHINE_FACTORY:
      case OBJECT_CLASS.SCHOOL_OF_WAR:
      case OBJECT_CLASS.WARRIORS_TOMB:
      case OBJECT_CLASS.WATER_WHEEL:
      case OBJECT_CLASS.WATERING_HOLE:
      case OBJECT_CLASS.WHIRLPOOL:
      case OBJECT_CLASS.WINDMILL:
      case OBJECT_CLASS.MARKET_OF_TIME:
      case OBJECT_CLASS.DECORATIVE_TOWN:
      case OBJECT_CLASS.TRADING_POST_SNOW:
      case OBJECT_CLASS.PYRAMID:
      case OBJECT_CLASS.BORDER_GATE:
      case OBJECT_CLASS.FREELANCERS_GUILD:
      case OBJECT_CLASS.CAMPFIRE:
      case OBJECT_CLASS.FLOTSAM:
      case OBJECT_CLASS.SEA_CHEST:
      case OBJECT_CLASS.SHIPWRECK_SURVIVOR:
      case OBJECT_CLASS.TREASURE_CHEST:
      case OBJECT_CLASS.SUBTERRANEAN_GATE:
        object_definition.object_class_group_name = 'OBJECT'
        break
      case OBJECT_CLASS.TOWN:
      case OBJECT_CLASS.RANDOM_TOWN:
        object_definition.object_class_group_name = 'TOWN'
        if (map.format >= FORMAT.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.owner = reader.readByte()
        if (reader.readBool()) {
          object_definition.name = reader.readString(reader.readInt())
        }
        if (reader.readBool()) {
          object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
        }
        object_definition.formation = reader.readByte()
        if (reader.readBool()) {
          object_definition.built_buildings = Array(6).fill().map(_ => { return reader.readByte() })
          object_definition.disabled_buildings = Array(6).fill().map(_ => { return reader.readByte() })
        } else {
          object_definition.has_fort = reader.readBool()
        }
        if (map.format >= FORMAT.AB) {
          object_definition.must_have_spells = Array(9).fill().map(_ => { return reader.readByte() })
        }
        object_definition.may_have_spells = Array(9).fill().map(_ => { return reader.readByte() })
        object_definition.events = reader.readEvents(map)
        if (map.format >= FORMAT.SOD) {
          object_definition.alignment = reader.readByte()
        }
        object_definition.unknown = Array(3).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.RANDOM_DWELLING:
      case OBJECT_CLASS.RANDOM_DWELLING_FACTION:
      case OBJECT_CLASS.RANDOM_DWELLING_LVL:
        object_definition.object_class_group_name = 'RANDOM_DWELLING'
        object_definition.owner = reader.readInt()
        if (object_class != OBJECT_CLASS.RANDOM_DWELLING_FACTION) {
          object_definition.castle_id = reader.readInt()
          if (object_definition.castle_id == 0) {
            object_definition.alignments = Array(2).fill().map(_ => { return reader.readByte() })
          }
        }
        if (object_class != OBJECT_CLASS.RANDOM_DWELLING_LVL) {
          object_definition.min_level = reader.readByte()
          object_definition.max_level = reader.readByte()
        }
        break
      case OBJECT_CLASS.HERO:
      case OBJECT_CLASS.RANDOM_HERO:
      case OBJECT_CLASS.PRISON:
        object_definition.object_class_group_name = 'HERO'
        if (map.format >= FORMAT.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.owner = reader.readByte()
        object_definition.type = reader.readByte()
        if (reader.readBool()) {
          object_definition.name = reader.readString(reader.readInt())
        }
        if (map.format >= FORMAT.SOD) {
          if (reader.readBool()) {
            object_definition.experience = reader.readInt()
          }
        } else {
          object_definition.experience = reader.readInt()
        }
        if (reader.readBool()) {
          object_definition.face = reader.readByte()
        }
        if (reader.readBool()) {
          object_definition.secondary_skills = reader.readSecondarySkills()
        }
        if (reader.readBool()) {
          object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
        }
        object_definition.formation = reader.readByte()
        if (reader.readBool()) {
          object_definition.artifacts = reader.readArtifacts()
          object_definition.backpack = Array(reader.readShort()).fill().map(_ => { return reader.readArtifact(map) })
        }
        object_definition.patrol_radius = reader.readByte()
        if (map.format >= FORMAT.AB) {
          if (reader.readBool()) {
            object_definition.biography = reader.readString(reader.readInt())
          }
          object_definition.gender = reader.readByte()
        }
        if (map.format == FORMAT.AB) {
          object_definition.spells = [reader.readByte()]
        } else if (map.format >= FORMAT.SOD) {
          if (reader.readBool()) {
            object_definition.spells = Array(9).fill().map(_ => { return reader.readByte() })
          }
        }
        if (map.format >= FORMAT.SOD) {
          if (reader.readBool()) {
            object_definition.primary_skills = reader.readPrimarySkills()
          }
        }
        object_definition.unknown = Array(16).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.MONSTER:
      case OBJECT_CLASS.RANDOM_MONSTER:
      case OBJECT_CLASS.RANDOM_MONSTER_L1:
      case OBJECT_CLASS.RANDOM_MONSTER_L2:
      case OBJECT_CLASS.RANDOM_MONSTER_L3:
      case OBJECT_CLASS.RANDOM_MONSTER_L4:
      case OBJECT_CLASS.RANDOM_MONSTER_L5:
      case OBJECT_CLASS.RANDOM_MONSTER_L6:
      case OBJECT_CLASS.RANDOM_MONSTER_L7:
        object_definition.object_class_group_name = 'MONSTER'
        if (map.format >= FORMAT.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.quantity = reader.readShort()
        object_definition.disposition = reader.readByte()
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          object_definition.resources = Array(7).fill().map(_ => { return reader.readInt() })
          object_definition.artifact = reader.readArtifact(map)
        }
        object_definition.never_flees = reader.readByte()
        object_definition.does_not_grow = reader.readByte()
        object_definition.unknown = Array(2).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.ARTIFACT:
      case OBJECT_CLASS.RANDOM_ART:
      case OBJECT_CLASS.RANDOM_TREASURE_ART:
      case OBJECT_CLASS.RANDOM_MINOR_ART:
      case OBJECT_CLASS.RANDOM_MAJOR_ART:
      case OBJECT_CLASS.RANDOM_RELIC_ART:
        object_definition.object_class_group_name = 'ARTIFACT'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill().map(_ => { return reader.readByte() })
        }
        break
      case OBJECT_CLASS.SHRINE_OF_MAGIC_INCANTATION:
      case OBJECT_CLASS.SHRINE_OF_MAGIC_GESTURE:
      case OBJECT_CLASS.SHRINE_OF_MAGIC_THOUGHT:
        object_definition.object_class_group_name = 'SHRINE_OF_MAGIC'
        object_definition.spell = reader.readInt()
        break
      case OBJECT_CLASS.SPELL_SCROLL:
        object_definition.object_class_group_name = 'SPELL_SCROLL'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill().map(_ => { return reader.readByte() })
        }
        object_definition.spell = reader.readInt()
        break
      case OBJECT_CLASS.RESOURCE:
      case OBJECT_CLASS.RANDOM_RESOURCE:
        object_definition.object_class_group_name = 'RESOURCE'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill().map(_ => { return reader.readByte() })
        }
        object_definition.quantity = reader.readInt()
        object_definition.unknown1 = Array(4).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.WITCH_HUT:
        object_definition.object_class_group_name = 'WITCH_HUT'
        if (map.format >= FORMAT.AB) {
          object_definition.potential_skills = Array(4).fill().map(_ => { return reader.readByte() })
        }
        break
      case OBJECT_CLASS.SEER_HUT:
        object_definition.object_class_group_name = 'SEER_HUT'
        if (map.format == FORMAT.ROE) {
          object_definition.artifact = reader.readByte()
        } else {
          object_definition.quest = reader.readQuest(map)
        }
        object_definition.reward_type = reader.readByte()
        switch(object_definition.reward_type) {
          case REWARD_TYPE.EXPERIENCE:
          case REWARD_TYPE.SPELL_POINTS:
            object_definition.reward = Array(4).fill().map(_ => { return reader.readByte() })
            break
          case REWARD_TYPE.ARTIFACT:
            if (map.format == FORMAT.ROE) {
              object_definition.reward = Array(1).fill().map(_ => { return reader.readByte() })
            } else {
              object_definition.reward = Array(2).fill().map(_ => { return reader.readByte() })
            }
            break
          case REWARD_TYPE.LUCK:
          case REWARD_TYPE.MORALE:
          case REWARD_TYPE.SPELL:
            object_definition.reward = Array(1).fill().map(_ => { return reader.readByte() })
            break
          case REWARD_TYPE.RESOURCE:
            object_definition.reward = Array(5).fill().map(_ => { return reader.readByte() })
            break
          case REWARD_TYPE.PRIMARY_SKILL:
          case REWARD_TYPE.SECONDARY_SKILL:
            object_definition.reward = Array(2).fill().map(_ => { return reader.readByte() })
            break
          case REWARD_TYPE.CREATURE:
            if (map.format == FORMAT.ROE) {
              object_definition.reward = Array(3).fill().map(_ => { return reader.readByte() })
            } else {
              object_definition.reward = Array(4).fill().map(_ => { return reader.readByte() })
            }
            break
        }
        object_definition.unknown = Array(2).fill().map(_ => { return reader.readByte() })
        break
      case OBJECT_CLASS.SCHOLAR:
        object_definition.object_class_group_name = 'SCHOLAR'
        object_definition.reward_type = reader.readByte()
        object_definition.reward_value = reader.readByte()
        object_definition.unknown = Array(6).fill().map(_ => { return reader.readByte() })
        break
    }
    return object_definition
  })
  map.object_definitions = object_definitions

  map.events = reader.readEvents(map)

  fs.writeFileSync(outputFile, JSON.stringify(map, null, 2))
}

function extractDir(inputDir = process.env.HOMM3_HOME + '/Maps', outputDir = 'data/h3m') {
  const inputFiles = fs.readdirSync(inputDir).filter(inputFile => inputFile.endsWith('.h3m'))
  inputFiles.forEach(inputFile => {
    extract(inputDir + '/' + inputFile, outputDir)
  })
}

extract(process.env.HOMM3_HOME + '/Maps/Manifest Destiny.h3m', 'data/h3m')