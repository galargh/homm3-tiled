import MapReader from './readers/MapReader'
import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import Format from './enums/Format'
import ObjectClass from './enums/ObjectClass'
import RewardType from './enums/RewardType'
import SpecialLossCondition from './enums/SpecialLossCondition'
import SpecialWinCondition from './enums/SpecialWinCondition'

function extract(inputFile: string, outputDir: string) {
  const inputFileName = path.parse(inputFile).base.replace('.h3m', '')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputFile = outputDir + '/' + inputFileName + '.json'
  if (fs.existsSync(outputFile)) {
    return
  }
  const map = {}  as any
  const reader = new MapReader(zlib.unzipSync(fs.readFileSync(inputFile)))
  map.format = reader.readInt()
  map.has_hero = reader.readBool()
  map.size = reader.readInt()
  map.has_second_level = reader.readBool()
  map.name = reader.readString(reader.readInt())
  map.description = reader.readString(reader.readInt())
  map.difficulty = reader.readByte()

  if (map.format >= Format.AB) {
    map.mastery_cap = reader.readByte()
  }

  map.players = Array(8).fill(undefined).map(_ => {
    const player = {} as any
    player.can_be_human = reader.readBool()
    player.can_be_computer = reader.readBool()
    player.behavior = reader.readByte()
    if (map.format >= Format.SOD) {
      player.allowed_alignments = reader.readByte()
    }
    player.town_types = reader.readByte()
    if (map.format >= Format.AB) {
      player.town_conflux = reader.readByte()
    }
    player.unknown = reader.readByte()
    player.has_main_town = reader.readBool()

    if (player.has_main_town) {
      if (map.format >= Format.AB) {
        player.starting_town_create_hero = reader.readByte()
        player.starting_town_type = reader.readByte()
      }
      player.starting_town_xpos = reader.readByte()
      player.starting_town_ypos = reader.readByte()
      player.starting_town_zpos = reader.readByte()
    }

    player.starting_hero_is_random = reader.readBool()
    player.starting_hero_type = reader.readByte()

    if (player.starting_hero_type != 0xFF || map.format >= Format.AB) {
      player.starting_hero_face = reader.readByte()
      player.starting_hero_name = reader.readString(reader.readInt())
    }
    return player
  })

  const special_win_condition = {} as any
  special_win_condition.id = reader.readByte()

  switch(special_win_condition.id) {
    case SpecialWinCondition.ACQUIRE_ARTIFACT:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      if (map.format == Format.ROE) {
        special_win_condition.type = reader.readByte()
      } else {
        special_win_condition.type = reader.readShort()
      }
      break
    case SpecialWinCondition.ACCUMULATE_CREATURES:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      if (map.format == Format.ROE) {
        special_win_condition.type = reader.readByte()
      } else {
        special_win_condition.type = reader.readShort()
      }
      special_win_condition.amount = reader.readInt()
      break
    case SpecialWinCondition.ACCUMULATE_RESOURCES:
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
    case SpecialWinCondition.UPGRADE_TOWN:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      special_win_condition.hall_level = reader.readByte()
      special_win_condition.castle_level = reader.readByte()
      break
    case SpecialWinCondition.BUILD_GRAIL:
    case SpecialWinCondition.DEFEAT_HERO:
    case SpecialWinCondition.CAPTURE_TOWN:
    case SpecialWinCondition.DEFEAT_MONSTER:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      break
    case SpecialWinCondition.FLAG_DWELLINGS:
    case SpecialWinCondition.FLAG_MINES:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      break
    case SpecialWinCondition.TRANSPORT_ARTIFACT:
      special_win_condition.allow_normal_win = reader.readBool()
      special_win_condition.applies_to_computer = reader.readBool()
      special_win_condition.type = reader.readByte()
      special_win_condition.xpos = reader.readByte()
      special_win_condition.ypos = reader.readByte()
      special_win_condition.zpos = reader.readByte()
      break
  }
  map.special_win_condition = special_win_condition

  const special_loss_condition = {} as any
  special_loss_condition.id = reader.readByte()

  switch(special_loss_condition.id) {
    case SpecialLossCondition.LOSE_TOWN:
    case SpecialLossCondition.LOSE_HERO:
      special_loss_condition.xpos = reader.readByte()
      special_loss_condition.ypos = reader.readByte()
      special_loss_condition.zpos = reader.readByte()
      break
    case SpecialLossCondition.TIME:
      special_loss_condition.days = reader.readShort()
      break
  }
  map.special_loss_condition = special_loss_condition

  if (reader.readBool()) {
    map.teams = Array(8).fill(undefined).map(_ => { return reader.readByte() })
  }
  if (map.format == Format.ROE) {
    map.available_heroes = Array(16).fill(undefined).map(_ => { return reader.readByte() })
  } else {
    map.available_heroes = Array(20).fill(undefined).map(_ => { return reader.readByte() })
  }
  if (map.format >= Format.AB) {
    map.placeholder_heroes_count = reader.readInt()
  }
  if (map.format >= Format.SOD) {
    map.custom_heroes = Array(reader.readByte()).fill(undefined).map(_ => {
      const custom_hero = {} as any
      custom_hero.type = reader.readByte()
      custom_hero.face = reader.readByte()
      custom_hero.name = reader.readString(reader.readInt())
      custom_hero.allowed_players = reader.readByte()
      return custom_hero
    })
  }
  map.reserved = Array(31).fill(undefined).map(_ => { return reader.readByte() })
  if (map.format == Format.AB) {
    map.available_artifacts = Array(17).fill(undefined).map(_ => { return reader.readByte() })
  } else if (map.format >= Format.SOD) {
    map.available_artifacts = Array(18).fill(undefined).map(_ => { return reader.readByte() })
  }
  if (map.format >= Format.SOD) {
    map.available_spells = Array(9).fill(undefined).map(_ => { return reader.readByte() })
    map.available_skills = Array(4).fill(undefined).map(_ => { return reader.readByte() })
  }
  map.rumors = Array(reader.readInt()).fill(undefined).map(_ => {
    const rumor = {} as any
    rumor.name = reader.readString(reader.readInt())
    rumor.description = reader.readString(reader.readInt())
    return rumor
  })
  if (map.format >= Format.SOD) {
    map.hero_settings = Array(156).fill(undefined).map(_ => {
      const hero = {} as any
      if (reader.readBool()) {
        if (reader.readBool()) {
          hero.experience = reader.readInt()
        }
        // face?
        if (reader.readBool()) {
          hero.secondary_skills = reader.readSecondarySkills()
        }
        if (reader.readBool()) {
          hero.artifacts = reader.readArtifacts(map)
          hero.backpack = Array(reader.readShort()).fill(undefined).map(_ => { return reader.readArtifact(map) })
        }
        if (reader.readBool()) {
          hero.biography = reader.readString(reader.readInt())
        }
        hero.gender = reader.readByte()
        if (reader.readBool()) {
          hero.spells = Array(9).fill(undefined).map(_ => { return reader.readByte() })
        }
        if (reader.readBool()) {
          hero.primary_skills = reader.readPrimarySkills()
        }
      }
      return hero
    })
  }
  const tiles_count = map.has_second_level ? map.size * map.size * 2 : map.size * map.size
  map.tiles = Array(tiles_count).fill(undefined).map(_ => {
    const tile = {} as any
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

  map.object_attributes = Array(reader.readInt()).fill(undefined).map(_ => {
    const object_attribute = {} as any
    object_attribute.def = reader.readString(reader.readInt())
    // The passable and active arrays are bitfields representing an 8x6 tile
    // region where bit 1 marks passable and bit 0 impassable. Counting goes
    // from left to right downwards towards the bottom right corner. This means
    // that first bit in passable[0] is [x-7, y-5] from bottom right corner and
    // last bit in passable[6] is the bottom right corner.
    object_attribute.passable = Array(6).fill(undefined).map(_ => {
      const byte = reader.readByte()
      return Array(8).fill(undefined).map((_, bit) => { return byte & (1 << bit) ? 1 : 0 })
    })
    object_attribute.active =  Array(6).fill(undefined).map(_ => {
      const byte = reader.readByte()
      return Array(8).fill(undefined).map((_, bit) => { return byte & (1 << bit) ? 1 : 0 })
    })
    object_attribute.allowed_landscapes = reader.readShort()
    object_attribute.landscape_group = reader.readShort()
    object_attribute.object_class = reader.readInt()
    object_attribute.object_class_name = Object.keys(ObjectClass).find(key => { return ObjectClass[key as keyof typeof ObjectClass] == object_attribute.object_class })
    object_attribute.object_number = reader.readInt()
    // 1 - towns  2 - monsters  5 - treasure
    // 3 - heroes 4 - artifacts
    object_attribute.object_group = reader.readByte()
    object_attribute.above = reader.readByte()
    object_attribute.unknown = Array(16).fill(undefined).map(_ => { return reader.readByte() })
    return object_attribute
  })

  // TODO: https://github.com/potmdehex/homm3tools/blob/5687f581a4eb5e7b0e8f48794d7be4e3b0a8cc8b/h3m/h3mlib/h3m_parsing/parse_oa.c#L108

  const object_definitions = Array(reader.readInt()).fill(undefined).map(_ => {
    const object_definition = {} as any
    object_definition.x = reader.readByte()
    object_definition.y = reader.readByte()
    object_definition.z = reader.readByte()
    object_definition.object_attributes_index = reader.readInt()
    object_definition.unknown = Array(5).fill(undefined).map(_ => { return reader.readByte() })

    const object_attribute = map.object_attributes[object_definition.object_attributes_index]
    const object_class = object_attribute.object_class

    switch(object_class) {
      case ObjectClass.HERO_PLACEHOLDER:
        object_definition.object_class_group_name = 'HERO_PLACEHOLDER'
        object_definition.owner = reader.readByte()
        object_definition.type = reader.readByte()
        if (object_definition.type == 0xFF) {
          object_definition.power_rating = reader.readByte()
        }
        break
      case ObjectClass.QUEST_GUARD:
        object_definition.object_class_group_name = 'QUEST_GUARD'
        object_definition.quest = reader.readQuest(map)
        break
      case ObjectClass.EVENT:
      case ObjectClass.PANDORAS_BOX:
        object_definition.object_class_group_name = 'EVENT'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        object_definition.experience = reader.readInt()
        object_definition.morale = reader.readByte()
        object_definition.luck = reader.readByte()
        object_definition.morale = reader.readByte()
        object_definition.resources = Array(7).fill(undefined).map(_ => { return reader.readInt() })
        object_definition.primary_skills = reader.readPrimarySkills()
        object_definition.secondary_skills = reader.readSecondarySkills()
        object_definition.artifacts = Array(reader.readByte()).fill(undefined).map(_ => { return reader.readArtifact(map) })
        object_definition.spells = Array(reader.readByte()).fill(undefined).map(_ => { return reader.readByte() })
        object_definition.creatures = Array(reader.readByte()).fill(undefined).map(_ => { reader.readCreature(map) })
        object_definition.unknown = Array(8).fill(undefined).map(_ => { return reader.readByte() })
        if (object_class == ObjectClass.EVENT) {
          object_definition.applies_to_players = reader.readByte()
          object_definition.applies_to_computer = reader.readByte()
          object_definition.cancel_after_visit = reader.readByte()
          object_definition.unknown1 = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        break
      case ObjectClass.SIGN:
      case ObjectClass.OCEAN_BOTTLE:
        object_definition.object_class_group_name = 'SIGN'
        object_definition.message = reader.readString(reader.readInt())
        object_definition.unknown = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.GARRISON:
      case ObjectClass.GARRISON2:
        object_definition.object_class_group_name = 'GARRISON'
        object_definition.owner = reader.readInt()
        object_definition.creatures = Array(7).fill(undefined).map(_ => { reader.readCreature(map) })
        if (map.format >= Format.AB) {
          object_definition.removable_units = reader.readByte()
        }
        object_definition.unknown = Array(8).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.GRAIL:
        object_definition.object_class_group_name = 'GRAIL'
        object_definition.allowable_radius = reader.readInt()
        break
      case ObjectClass.LIGHTHOUSE:
      case ObjectClass.SHIPYARD:
      case ObjectClass.MINE:
      case ObjectClass.CREATURE_GENERATOR1:
      case ObjectClass.CREATURE_GENERATOR2:
      case ObjectClass.CREATURE_GENERATOR3:
      case ObjectClass.CREATURE_GENERATOR4:
      case ObjectClass.ABANDONED_MINE:
        object_definition.object_class_group_name = 'DWELLING'
        object_definition.owner = reader.readInt()
        break
      case ObjectClass.BOAT:
      case ObjectClass.CLOVER_FIELD:
      case ObjectClass.EVIL_FOG:
      case ObjectClass.FAVORABLE_WINDS:
      case ObjectClass.FIERY_FIELDS:
      case ObjectClass.HOLY_GROUNDS:
      case ObjectClass.LUCID_POOLS:
      case ObjectClass.MAGIC_CLOUDS:
      case ObjectClass.ROCKLANDS:
      case ObjectClass.CURSED_GROUND2:
      case ObjectClass.MAGIC_PLAINS2:
      case ObjectClass.PASSABLE_139:
      case ObjectClass.PASSABLE_141:
      case ObjectClass.PASSABLE_142:
      case ObjectClass.PASSABLE_144:
      case ObjectClass.PASSABLE_145:
      case ObjectClass.PASSABLE_146:
      case ObjectClass.HOLE:
      case ObjectClass.CURSED_GROUND1:
      case ObjectClass.MAGIC_PLAINS1:
      case ObjectClass.PASSABLE_KELP:
      case ObjectClass.PASSABLE_KELP2:
      case ObjectClass.PASSABLE_HOLE2:
      case ObjectClass.NONE_0:
      case ObjectClass.BLANK_40:
      case ObjectClass.IMPASSABLE_BRUSH:
      case ObjectClass.IMPASSABLE_BUSH:
      case ObjectClass.IMPASSABLE_CACTUS:
      case ObjectClass.IMPASSABLE_CANYON:
      case ObjectClass.IMPASSABLE_CRATER:
      case ObjectClass.IMPASSABLE_DEADVEGETATION:
      case ObjectClass.IMPASSABLE_FLOWERS:
      case ObjectClass.IMPASSABLE_FROZENLIKE:
      case ObjectClass.IMPASSABLE_HEDGE:
      case ObjectClass.IMPASSABLE_HILL:
      case ObjectClass.IMPASSABLE_LAKE:
      case ObjectClass.IMPASSABLE_LAVAFLOW:
      case ObjectClass.IMPASSABLE_LAVALAKE:
      case ObjectClass.IMPASSABLE_MUSHROOMS:
      case ObjectClass.IMPASSABLE_LOG:
      case ObjectClass.IMPASSABLE_MANDRAKE:
      case ObjectClass.IMPASSABLE_MOSS:
      case ObjectClass.IMPASSABLE_MOUND:
      case ObjectClass.IMPASSABLE_MOUNTAIN:
      case ObjectClass.IMPASSABLE_OAKTREES:
      case ObjectClass.IMPASSABLE_OUTCROPPING:
      case ObjectClass.IMPASSABLE_PINETREES:
      case ObjectClass.IMPASSABLE_PLANT:
      case ObjectClass.IMPASSABLE_RIVERDELTA:
      case ObjectClass.IMPASSABLE_ROCK:
      case ObjectClass.IMPASSABLE_SANDDUNE:
      case ObjectClass.IMPASSABLE_SANDPIT:
      case ObjectClass.IMPASSABLE_SHRUB:
      case ObjectClass.IMPASSABLE_SKULL:
      case ObjectClass.IMPASSABLE_STALAGMITE:
      case ObjectClass.IMPASSABLE_STUMP:
      case ObjectClass.IMPASSABLE_TARPIT:
      case ObjectClass.IMPASSABLE_TREES:
      case ObjectClass.IMPASSABLE_VINE:
      case ObjectClass.IMPASSABLE_VOLCANICVENT:
      case ObjectClass.IMPASSABLE_VOLCANO:
      case ObjectClass.IMPASSABLE_WILLOWTREES:
      case ObjectClass.IMPASSABLE_YUCCATREES:
      case ObjectClass.IMPASSABLE_REEF:
      case ObjectClass.IMPASSABLE_BRUSH2:
      case ObjectClass.IMPASSABLE_BUSH2:
      case ObjectClass.IMPASSABLE_CACTUS2:
      case ObjectClass.IMPASSABLE_CANYON2:
      case ObjectClass.IMPASSABLE_CRATER2:
      case ObjectClass.IMPASSABLE_DEADVEGETATION2:
      case ObjectClass.IMPASSABLE_FLOWERS2:
      case ObjectClass.IMPASSABLE_FROZENLIKE2:
      case ObjectClass.IMPASSABLE_HEDGE2:
      case ObjectClass.IMPASSABLE_HILL2:
      case ObjectClass.IMPASSABLE_LAKE2:
      case ObjectClass.IMPASSABLE_LAVAFLOW2:
      case ObjectClass.IMPASSABLE_LAVALAKE2:
      case ObjectClass.IMPASSABLE_MUSHROOMS2:
      case ObjectClass.IMPASSABLE_LOG2:
      case ObjectClass.IMPASSABLE_MANDRAKE2:
      case ObjectClass.IMPASSABLE_MOSS2:
      case ObjectClass.IMPASSABLE_MOUND2:
      case ObjectClass.IMPASSABLE_MOUNTAIN2:
      case ObjectClass.IMPASSABLE_OAKTREES2:
      case ObjectClass.IMPASSABLE_OUTCROPPING2:
      case ObjectClass.IMPASSABLE_PINETREES2:
      case ObjectClass.IMPASSABLE_PLANT2:
      case ObjectClass.IMPASSABLE_RIVERDELTA2:
      case ObjectClass.IMPASSABLE_ROCK2:
      case ObjectClass.IMPASSABLE_SANDDUNE2:
      case ObjectClass.IMPASSABLE_SANDPIT2:
      case ObjectClass.IMPASSABLE_SHRUB2:
      case ObjectClass.IMPASSABLE_SKULL2:
      case ObjectClass.IMPASSABLE_STALAGMITE2:
      case ObjectClass.IMPASSABLE_STUMP2:
      case ObjectClass.IMPASSABLE_TARPIT2:
      case ObjectClass.IMPASSABLE_TREES2:
      case ObjectClass.IMPASSABLE_VINE2:
      case ObjectClass.IMPASSABLE_VOLCANICVENT2:
      case ObjectClass.IMPASSABLE_VOLCANO2:
      case ObjectClass.IMPASSABLE_WILLOWTREES2:
      case ObjectClass.IMPASSABLE_YUCCATREES2:
      case ObjectClass.IMPASSABLE_REEF2:
      case ObjectClass.IMPASSABLE_DESERTHILLS:
      case ObjectClass.IMPASSABLE_DIRTHILLS:
      case ObjectClass.IMPASSABLE_GRASSHILLS:
      case ObjectClass.IMPASSABLE_ROUGHHILLS:
      case ObjectClass.IMPASSABLE_SUBTERRANEANROCKS:
      case ObjectClass.IMPASSABLE_SWAMPFOLIAGE:
      case ObjectClass.ALTAR_OF_SACRIFICE:
      case ObjectClass.ANCHOR_POINT:
      case ObjectClass.ARENA:
      case ObjectClass.BLACK_MARKET:
      case ObjectClass.CARTOGRAPHER:
      case ObjectClass.BUOY:
      case ObjectClass.SWAN_POND:
      case ObjectClass.COVER_OF_DARKNESS:
      case ObjectClass.CREATURE_BANK:
      case ObjectClass.CORPSE:
      case ObjectClass.MARLETTO_TOWER:
      case ObjectClass.DERELICT_SHIP:
      case ObjectClass.DRAGON_UTOPIA:
      case ObjectClass.EYE_OF_MAGI:
      case ObjectClass.FAERIE_RING:
      case ObjectClass.FOUNTAIN_OF_FORTUNE:
      case ObjectClass.FOUNTAIN_OF_YOUTH:
      case ObjectClass.GARDEN_OF_REVELATION:
      case ObjectClass.HILL_FORT:
      case ObjectClass.HUT_OF_MAGI:
      case ObjectClass.IDOL_OF_FORTUNE:
      case ObjectClass.LEAN_TO:
      case ObjectClass.LIBRARY_OF_ENLIGHTENMENT:
      case ObjectClass.SCHOOL_OF_MAGIC:
      case ObjectClass.MAGIC_SPRING:
      case ObjectClass.MAGIC_WELL:
      case ObjectClass.MERCENARY_CAMP:
      case ObjectClass.MERMAID:
      case ObjectClass.MYSTICAL_GARDEN:
      case ObjectClass.OASIS:
      case ObjectClass.OBELISK:
      case ObjectClass.REDWOOD_OBSERVATORY:
      case ObjectClass.PILLAR_OF_FIRE:
      case ObjectClass.STAR_AXIS:
      case ObjectClass.RALLY_FLAG:
      case ObjectClass.BORDERGUARD:
      case ObjectClass.KEYMASTER:
      case ObjectClass.REFUGEE_CAMP:
      case ObjectClass.SANCTUARY:
      case ObjectClass.CRYPT:
      case ObjectClass.SHIPWRECK:
      case ObjectClass.SIRENS:
      case ObjectClass.STABLES:
      case ObjectClass.TAVERN:
      case ObjectClass.TEMPLE:
      case ObjectClass.DEN_OF_THIEVES:
      case ObjectClass.TRADING_POST:
      case ObjectClass.LEARNING_STONE:
      case ObjectClass.TREE_OF_KNOWLEDGE:
      case ObjectClass.UNIVERSITY:
      case ObjectClass.WAGON:
      case ObjectClass.WAR_MACHINE_FACTORY:
      case ObjectClass.SCHOOL_OF_WAR:
      case ObjectClass.WARRIORS_TOMB:
      case ObjectClass.WATER_WHEEL:
      case ObjectClass.WATERING_HOLE:
      case ObjectClass.WHIRLPOOL:
      case ObjectClass.WINDMILL:
      case ObjectClass.MARKET_OF_TIME:
      case ObjectClass.DECORATIVE_TOWN:
      case ObjectClass.TRADING_POST_SNOW:
      case ObjectClass.PYRAMID:
      case ObjectClass.BORDER_GATE:
      case ObjectClass.FREELANCERS_GUILD:
      case ObjectClass.CAMPFIRE:
      case ObjectClass.FLOTSAM:
      case ObjectClass.SEA_CHEST:
      case ObjectClass.SHIPWRECK_SURVIVOR:
      case ObjectClass.TREASURE_CHEST:
      case ObjectClass.SUBTERRANEAN_GATE:
        object_definition.object_class_group_name = 'OBJECT'
        break
      case ObjectClass.TOWN:
      case ObjectClass.RANDOM_TOWN:
        object_definition.object_class_group_name = 'TOWN'
        if (map.format >= Format.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.owner = reader.readByte()
        if (reader.readBool()) {
          object_definition.name = reader.readString(reader.readInt())
        }
        if (reader.readBool()) {
          object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
        }
        object_definition.formation = reader.readByte()
        if (reader.readBool()) {
          object_definition.built_buildings = Array(6).fill(undefined).map(_ => { return reader.readByte() })
          object_definition.disabled_buildings = Array(6).fill(undefined).map(_ => { return reader.readByte() })
        } else {
          object_definition.has_fort = reader.readBool()
        }
        if (map.format >= Format.AB) {
          object_definition.must_have_spells = Array(9).fill(undefined).map(_ => { return reader.readByte() })
        }
        object_definition.may_have_spells = Array(9).fill(undefined).map(_ => { return reader.readByte() })
        object_definition.events = reader.readEvents(map)
        if (map.format >= Format.SOD) {
          object_definition.alignment = reader.readByte()
        }
        object_definition.unknown = Array(3).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.RANDOM_DWELLING:
      case ObjectClass.RANDOM_DWELLING_FACTION:
      case ObjectClass.RANDOM_DWELLING_LVL:
        object_definition.object_class_group_name = 'RANDOM_DWELLING'
        object_definition.owner = reader.readInt()
        if (object_class != ObjectClass.RANDOM_DWELLING_FACTION) {
          object_definition.castle_id = reader.readInt()
          if (object_definition.castle_id == 0) {
            object_definition.alignments = Array(2).fill(undefined).map(_ => { return reader.readByte() })
          }
        }
        if (object_class != ObjectClass.RANDOM_DWELLING_LVL) {
          object_definition.min_level = reader.readByte()
          object_definition.max_level = reader.readByte()
        }
        break
      case ObjectClass.HERO:
      case ObjectClass.RANDOM_HERO:
      case ObjectClass.PRISON:
        object_definition.object_class_group_name = 'HERO'
        if (map.format >= Format.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.owner = reader.readByte()
        object_definition.type = reader.readByte()
        if (reader.readBool()) {
          object_definition.name = reader.readString(reader.readInt())
        }
        if (map.format >= Format.SOD) {
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
          object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
        }
        object_definition.formation = reader.readByte()
        if (reader.readBool()) {
          object_definition.artifacts = reader.readArtifacts(map)
          object_definition.backpack = Array(reader.readShort()).fill(undefined).map(_ => { return reader.readArtifact(map) })
        }
        object_definition.patrol_radius = reader.readByte()
        if (map.format >= Format.AB) {
          if (reader.readBool()) {
            object_definition.biography = reader.readString(reader.readInt())
          }
          object_definition.gender = reader.readByte()
        }
        if (map.format == Format.AB) {
          object_definition.spells = [reader.readByte()]
        } else if (map.format >= Format.SOD) {
          if (reader.readBool()) {
            object_definition.spells = Array(9).fill(undefined).map(_ => { return reader.readByte() })
          }
        }
        if (map.format >= Format.SOD) {
          if (reader.readBool()) {
            object_definition.primary_skills = reader.readPrimarySkills()
          }
        }
        object_definition.unknown = Array(16).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.MONSTER:
      case ObjectClass.RANDOM_MONSTER:
      case ObjectClass.RANDOM_MONSTER_L1:
      case ObjectClass.RANDOM_MONSTER_L2:
      case ObjectClass.RANDOM_MONSTER_L3:
      case ObjectClass.RANDOM_MONSTER_L4:
      case ObjectClass.RANDOM_MONSTER_L5:
      case ObjectClass.RANDOM_MONSTER_L6:
      case ObjectClass.RANDOM_MONSTER_L7:
        object_definition.object_class_group_name = 'MONSTER'
        if (map.format >= Format.AB) {
          object_definition.id = reader.readInt()
        }
        object_definition.quantity = reader.readShort()
        object_definition.disposition = reader.readByte()
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          object_definition.resources = Array(7).fill(undefined).map(_ => { return reader.readInt() })
          object_definition.artifact = reader.readArtifact(map)
        }
        object_definition.never_flees = reader.readByte()
        object_definition.does_not_grow = reader.readByte()
        object_definition.unknown = Array(2).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.ARTIFACT:
      case ObjectClass.RANDOM_ART:
      case ObjectClass.RANDOM_TREASURE_ART:
      case ObjectClass.RANDOM_MINOR_ART:
      case ObjectClass.RANDOM_MAJOR_ART:
      case ObjectClass.RANDOM_RELIC_ART:
        object_definition.object_class_group_name = 'ARTIFACT'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        break
      case ObjectClass.SHRINE_OF_MAGIC_INCANTATION:
      case ObjectClass.SHRINE_OF_MAGIC_GESTURE:
      case ObjectClass.SHRINE_OF_MAGIC_THOUGHT:
        object_definition.object_class_group_name = 'SHRINE_OF_MAGIC'
        object_definition.spell = reader.readInt()
        break
      case ObjectClass.SPELL_SCROLL:
        object_definition.object_class_group_name = 'SPELL_SCROLL'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        object_definition.spell = reader.readInt()
        break
      case ObjectClass.RESOURCE:
      case ObjectClass.RANDOM_RESOURCE:
        object_definition.object_class_group_name = 'RESOURCE'
        if (reader.readBool()) {
          object_definition.message = reader.readString(reader.readInt())
          if (reader.readBool()) {
            object_definition.creatures = Array(7).fill(undefined).map(_ => { return reader.readCreature(map) })
          }
          object_definition.unknown = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        object_definition.quantity = reader.readInt()
        object_definition.unknown1 = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.WITCH_HUT:
        object_definition.object_class_group_name = 'WITCH_HUT'
        if (map.format >= Format.AB) {
          object_definition.potential_skills = Array(4).fill(undefined).map(_ => { return reader.readByte() })
        }
        break
      case ObjectClass.SEER_HUT:
        object_definition.object_class_group_name = 'SEER_HUT'
        if (map.format == Format.ROE) {
          object_definition.artifact = reader.readByte()
        } else {
          object_definition.quest = reader.readQuest(map)
        }
        object_definition.reward_type = reader.readByte()
        switch(object_definition.reward_type) {
          case RewardType.EXPERIENCE:
          case RewardType.SPELL_POINTS:
            object_definition.reward = Array(4).fill(undefined).map(_ => { return reader.readByte() })
            break
          case RewardType.ARTIFACT:
            if (map.format == Format.ROE) {
              object_definition.reward = Array(1).fill(undefined).map(_ => { return reader.readByte() })
            } else {
              object_definition.reward = Array(2).fill(undefined).map(_ => { return reader.readByte() })
            }
            break
          case RewardType.LUCK:
          case RewardType.MORALE:
          case RewardType.SPELL:
            object_definition.reward = Array(1).fill(undefined).map(_ => { return reader.readByte() })
            break
          case RewardType.RESOURCE:
            object_definition.reward = Array(5).fill(undefined).map(_ => { return reader.readByte() })
            break
          case RewardType.PRIMARY_SKILL:
          case RewardType.SECONDARY_SKILL:
            object_definition.reward = Array(2).fill(undefined).map(_ => { return reader.readByte() })
            break
          case RewardType.CREATURE:
            if (map.format == Format.ROE) {
              object_definition.reward = Array(3).fill(undefined).map(_ => { return reader.readByte() })
            } else {
              object_definition.reward = Array(4).fill(undefined).map(_ => { return reader.readByte() })
            }
            break
        }
        object_definition.unknown = Array(2).fill(undefined).map(_ => { return reader.readByte() })
        break
      case ObjectClass.SCHOLAR:
        object_definition.object_class_group_name = 'SCHOLAR'
        object_definition.reward_type = reader.readByte()
        object_definition.reward_value = reader.readByte()
        object_definition.unknown = Array(6).fill(undefined).map(_ => { return reader.readByte() })
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