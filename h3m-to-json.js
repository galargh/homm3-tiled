const fs = require('fs');
const path = require('path');
const FileReader = require('filereader');
const image_size = require('image-size');
const files =  fs.readdirSync('.').filter(file => file.endsWith('.h3m'))

const FORMAT = {
  ROE:  0x0000000E,
  AB:   0x00000015,
  SOD:  0x0000001C,
  CHR:  0x0000001D,
  WOG:  0x00000033,
  HOTA: 0x0000020
}

const SPECIAL_WIN_CONDITION = {
  ACQUIRE_ARTIFACT:     0x00,
  ACCUMULATE_CREATURES: 0x01,
  ACCUMULATE_RESOURCES: 0x02,
  UPGRADE_TOWN:         0x03,
  BUILD_GRAIL:          0x04,
  DEFEAT_HERO:          0x05,
  CAPTURE_TOWN:         0x06,
  DEFEAT_MONSTER:       0x07,
  FLAG_DWELLINGS:       0x08,
  FLAG_MINES:           0x09,
  TRANSPORT_ARTIFACT:   0x0A
}

const SPECIAL_LOSS_CONDITION = {
  LOSE_TOWN: 0x00,
  LOSE_HERO: 0x01,
  TIME:      0x02
}

const OBJECT_CLASS = {
  NO_OBJ:                       -1,
  NONE_0:                       0,
  DECORATIVE_TOWN:              1,
  ALTAR_OF_SACRIFICE:           2,
  ANCHOR_POINT:                 3,
  ARENA:                        4,
  ARTIFACT:                     5,
  PANDORAS_BOX:                 6,
  BLACK_MARKET:                 7,
  BOAT:                         8,
  BORDERGUARD:                  9,
  KEYMASTER:                    10,
  BUOY:                         11,
  CAMPFIRE:                     12,
  CARTOGRAPHER:                 13,
  SWAN_POND:                    14,
  COVER_OF_DARKNESS:            15,
  CREATURE_BANK:                16,
  CREATURE_GENERATOR1:          17,
  CREATURE_GENERATOR2:          18,
  CREATURE_GENERATOR3:          19,
  CREATURE_GENERATOR4:          20,
  CURSED_GROUND1:               21,
  CORPSE:                       22,
  MARLETTO_TOWER:               23,
  DERELICT_SHIP:                24,
  DRAGON_UTOPIA:                25,
  EVENT:                        26,
  EYE_OF_MAGI:                  27,
  FAERIE_RING:                  28,
  FLOTSAM:                      29,
  FOUNTAIN_OF_FORTUNE:          30,
  FOUNTAIN_OF_YOUTH:            31,
  GARDEN_OF_REVELATION:         32,
  GARRISON:                     33,
  HERO:                         34,
  HILL_FORT:                    35,
  GRAIL:                        36,
  HUT_OF_MAGI:                  37,
  IDOL_OF_FORTUNE:              38,
  LEAN_TO:                      39,
  BLANK_40:                     40,
  LIBRARY_OF_ENLIGHTENMENT:     41,
  LIGHTHOUSE:                   42,
  MONOLITH_ONE_WAY_ENTRANCE:    43,
  MONOLITH_ONE_WAY_EXIT:        44,
  MONOLITH_TWO_WAY:             45,
  MAGIC_PLAINS1:                46,
  SCHOOL_OF_MAGIC:              47,
  MAGIC_SPRING:                 48,
  MAGIC_WELL:                   49,
  MARKET_OF_TIME:               50,
  MERCENARY_CAMP:               51,
  MERMAID:                      52,
  MINE:                         53,
  MONSTER:                      54,
  MYSTICAL_GARDEN:              55,
  OASIS:                        56,
  OBELISK:                      57,
  REDWOOD_OBSERVATORY:          58,
  OCEAN_BOTTLE:                 59,
  PILLAR_OF_FIRE:               60,
  STAR_AXIS:                    61,
  PRISON:                       62,
  PYRAMID:                      63,
  WOG_OBJECT:                   63,
  RALLY_FLAG:                   64,
  RANDOM_ART:                   65,
  RANDOM_TREASURE_ART:          66,
  RANDOM_MINOR_ART:             67,
  RANDOM_MAJOR_ART:             68,
  RANDOM_RELIC_ART:             69,
  RANDOM_HERO:                  70,
  RANDOM_MONSTER:               71,
  RANDOM_MONSTER_L1:            72,
  RANDOM_MONSTER_L2:            73,
  RANDOM_MONSTER_L3:            74,
  RANDOM_MONSTER_L4:            75,
  RANDOM_RESOURCE:              76,
  RANDOM_TOWN:                  77,
  REFUGEE_CAMP:                 78,
  RESOURCE:                     79,
  SANCTUARY:                    80,
  SCHOLAR:                      81,
  SEA_CHEST:                    82,
  SEER_HUT:                     83,
  CRYPT:                        84,
  SHIPWRECK:                    85,
  SHIPWRECK_SURVIVOR:           86,
  SHIPYARD:                     87,
  SHRINE_OF_MAGIC_INCANTATION:  88,
  SHRINE_OF_MAGIC_GESTURE:      89,
  SHRINE_OF_MAGIC_THOUGHT:      90,
  SIGN:                         91,
  SIRENS:                       92,
  SPELL_SCROLL:                 93,
  STABLES:                      94,
  TAVERN:                       95,
  TEMPLE:                       96,
  DEN_OF_THIEVES:               97,
  TOWN:                         98,
  TRADING_POST:                 99,
  LEARNING_STONE:               100,
  TREASURE_CHEST:               101,
  TREE_OF_KNOWLEDGE:            102,
  SUBTERRANEAN_GATE:            103,
  UNIVERSITY:                   104,
  WAGON:                        105,
  WAR_MACHINE_FACTORY:          106,
  SCHOOL_OF_WAR:                107,
  WARRIORS_TOMB:                108,
  WATER_WHEEL:                  109,
  WATERING_HOLE:                110,
  WHIRLPOOL:                    111,
  WINDMILL:                     112,
  WITCH_HUT:                    113,
  IMPASSABLE_BRUSH:             114,
  IMPASSABLE_BUSH:              115,
  IMPASSABLE_CACTUS:            116,
  IMPASSABLE_CANYON:            117,
  IMPASSABLE_CRATER:            118,
  IMPASSABLE_DEADVEGETATION:    119,
  IMPASSABLE_FLOWERS:           120,
  IMPASSABLE_FROZENLIKE:        121,
  IMPASSABLE_HEDGE:             122,
  IMPASSABLE_HILL:              123,
  HOLE:                         124,
  PASSABLE_HOLE:                124,
  PASSABLE_KELP:                125,
  IMPASSABLE_LAKE:              126,
  IMPASSABLE_LAVAFLOW:          127,
  IMPASSABLE_LAVALAKE:          128,
  IMPASSABLE_MUSHROOMS:         129,
  IMPASSABLE_LOG:               130,
  IMPASSABLE_MANDRAKE:          131,
  IMPASSABLE_MOSS:              132,
  IMPASSABLE_MOUND:             133,
  IMPASSABLE_MOUNTAIN:          134,
  IMPASSABLE_OAKTREES:          135,
  IMPASSABLE_OUTCROPPING:       136,
  IMPASSABLE_PINETREES:         137,
  IMPASSABLE_PLANT:             138,
  PASSABLE_139:                 139,
  PASSABLE_140:                 140,
  PASSABLE_141:                 141,
  PASSABLE_142:                 142,
  IMPASSABLE_RIVERDELTA:        143,
  PASSABLE_144:                 144,
  PASSABLE_145:                 145,
  PASSABLE_146:                 146,
  IMPASSABLE_ROCK:              147,
  IMPASSABLE_SANDDUNE:          148,
  IMPASSABLE_SANDPIT:           149,
  IMPASSABLE_SHRUB:             150,
  IMPASSABLE_SKULL:             151,
  IMPASSABLE_STALAGMITE:        152,
  IMPASSABLE_STUMP:             153,
  IMPASSABLE_TARPIT:            154,
  IMPASSABLE_TREES:             155,
  IMPASSABLE_VINE:              156,
  IMPASSABLE_VOLCANICVENT:      157,
  IMPASSABLE_VOLCANO:           158,
  IMPASSABLE_WILLOWTREES:       159,
  IMPASSABLE_YUCCATREES:        160,
  IMPASSABLE_REEF:              161,
  RANDOM_MONSTER_L5:            162,
  RANDOM_MONSTER_L6:            163,
  RANDOM_MONSTER_L7:            164,
  IMPASSABLE_BRUSH2:            165,
  IMPASSABLE_BUSH2:             166,
  IMPASSABLE_CACTUS2:           167,
  IMPASSABLE_CANYON2:           168,
  IMPASSABLE_CRATER2:           169,
  IMPASSABLE_DEADVEGETATION2:   170,
  IMPASSABLE_FLOWERS2:          171,
  IMPASSABLE_FROZENLIKE2:       172,
  IMPASSABLE_HEDGE2:            173,
  IMPASSABLE_HILL2:             174,
  PASSABLE_HOLE2:               175,
  PASSABLE_KELP2:               176,
  IMPASSABLE_LAKE2:             177,
  IMPASSABLE_LAVAFLOW2:         178,
  IMPASSABLE_LAVALAKE2:         179,
  IMPASSABLE_MUSHROOMS2:        180,
  IMPASSABLE_LOG2:              181,
  IMPASSABLE_MANDRAKE2:         182,
  IMPASSABLE_MOSS2:             183,
  IMPASSABLE_MOUND2:            184,
  IMPASSABLE_MOUNTAIN2:         185,
  IMPASSABLE_OAKTREES2:         186,
  IMPASSABLE_OUTCROPPING2:      187,
  IMPASSABLE_PINETREES2:        188,
  IMPASSABLE_PLANT2:            189,
  IMPASSABLE_RIVERDELTA2:       190,
  IMPASSABLE_ROCK2:             191,
  IMPASSABLE_SANDDUNE2:         192,
  IMPASSABLE_SANDPIT2:          193,
  IMPASSABLE_SHRUB2:            194,
  IMPASSABLE_SKULL2:            195,
  IMPASSABLE_STALAGMITE2:       196,
  IMPASSABLE_STUMP2:            197,
  IMPASSABLE_TARPIT2:           198,
  IMPASSABLE_TREES2:            199,
  IMPASSABLE_VINE2:             200,
  IMPASSABLE_VOLCANICVENT2:     201,
  IMPASSABLE_VOLCANO2:          202,
  IMPASSABLE_WILLOWTREES2:      203,
  IMPASSABLE_YUCCATREES2:       204,
  IMPASSABLE_REEF2:             205,
  IMPASSABLE_DESERTHILLS:       206,
  IMPASSABLE_DIRTHILLS:         207,
  IMPASSABLE_GRASSHILLS:        208,
  IMPASSABLE_ROUGHHILLS:        209,
  IMPASSABLE_SUBTERRANEANROCKS: 210,
  IMPASSABLE_SWAMPFOLIAGE:      211,
  BORDER_GATE:                  212,
  FREELANCERS_GUILD:            213,
  HERO_PLACEHOLDER:             214,
  QUEST_GUARD:                  215,
  RANDOM_DWELLING:              216,
  RANDOM_DWELLING_LVL:          217,
  RANDOM_DWELLING_FACTION:      218,
  GARRISON2:                    219,
  ABANDONED_MINE:               220,
  TRADING_POST_SNOW:            221,
  CLOVER_FIELD:                 222,
  CURSED_GROUND2:               223,
  EVIL_FOG:                     224,
  FAVORABLE_WINDS:              225,
  FIERY_FIELDS:                 226,
  HOLY_GROUNDS:                 227,
  LUCID_POOLS:                  228,
  MAGIC_CLOUDS:                 229,
  MAGIC_PLAINS2:                230,
  ROCKLANDS:                    231
}

const QUEST_TYPE = {
  NONE:           0x00,
  EXPERIENCE:     0x01,
  PRIMARY_SKILLS: 0x02,
  DEFEAT_HERO:    0x03,
  DEFEAT_MONSTER: 0x04,
  ARTIFACTS:      0x05,
  CREATURES:      0x06,
  RESOURCES:      0x07,
  BE_HERO:        0x08,
  BE_PLAYER:      0x09
}

const REWARD_TYPE = {
  NONE:            0x00,
  EXPERIENCE:      0x01,
  SPELL_POINTS:    0x02,
  MORALE:          0x03,
  LUCK:            0x04,
  RESOURCE:        0x05,
  PRIMARY_SKILL:   0x06,
  SECONDARY_SKILL: 0x07,
  ARTIFACT:        0x08,
  SPELL:           0x09,
  CREATURE:        0x0A
}

class H3mReader {
  constructor(file) {
    this.content = fs.readFileSync(file)
    this.offset = 0
  }

  nextInt() {
    const val = this.content.readUInt32LE(this.offset)
    this.offset += 4
    return val
  }

  nextShort() {
    const val = this.content.readUInt16LE(this.offset)
    this.offset += 2
    return val
  }

  nextByte() {
    const val = this.content.readUInt8(this.offset)
    this.offset += 1
    return val
  }

  nextBool() {
    return this.nextByte() != 0
  }

  nextString() {
    const length = this.nextInt()
    const val = Buffer.from(this.content.slice(this.offset, this.offset + length)).toString()
    this.offset += length
    return val
  }

  nextPrimarySkills() {
    const val = {}
    val.attack_skill = this.nextByte()
    val.defense_skill = this.nextByte()
    val.spell_power = this.nextByte()
    val.knowledge = this.nextByte()
    return val
  }

  nextSecondarySkills() {
    return Array.fill(this.nextByte()).map(_ => {
      const val = {}
      val.type = this.nextByte()
      val.level = this.nextByte()
      return val
    })
  }

  nextCreature(ctx) {
    const val = {}
    if (ctx.format == FORMAT.ROE) {
      val.type = this.nextByte()
    } else {
      val.type = this.nextShort()
    }
    // type != 0xFF
    val.quantity = this.nextShort()
    return val
  }

  nextArtifact(ctx) {
    if (ctx.format == FORMAT.ROE) {
      return this.nextByte()
    } else {
      return this.nextShort()
    }
  }

  nextArtifacts(ctx) {
    if (ctx.format < FORMAT.SOD) {
      return Array(18).fill().map(_ => { return this.nextArtifact(ctx) })
    } else {
      return Array(19).fill().map(_ => { return this.nextArtifact(ctx) })
    }
  }

  nextQuest(ctx) {
    const val = {}
    val.type = this.nextByte()
    if (val.type != 0xFF) {
      switch(val.type) {
        case QUEST_TYPE.EXPERIENCE:
          val.experience = this.nextInt()
          break
        case QUEST_TYPE.PRIMARY_SKILLS:
          val.primary_skills = this.nextPrimarySkills()
          break
        case QUEST_TYPE.DEFEAT_HERO:
          val.hero_id = this.nextInt()
          break
        case QUEST_TYPE.DEFEAT_MONSTER:
          val.quest_monster_id = this.nextInt()
          break
        case QUEST_TYPE.ARTIFACTS:
          val.artifacts = Array(this.nextByte()).fill().map(_ => { return this.nextArtifact(ctx) })
          break
        case QUEST_TYPE.CREATURES:
          val.creatures = Array(this.nextByte()).fill().map(_ => { return this.nextCreature(ctx) })
          break
        case QUEST_TYPE.RESOURCES:
          val.resources = Array(7).fill().map(_ => { return this.nextInt() })
          break
        case QUEST_TYPE.BE_HERO:
          val.quest_hero_type = this.nextByte()
          break
        case QUEST_TYPE.BE_PLAYER:
          val.quest_player_flag = this.nextByte()
          break
      }
    }
    val.deadline = reader.nextInt()
    if (val.quest.type != 0xFF && ctx.format >= FORMAT.SOD) {
      val.proposal_messaage = this.nextString()
      val.progress_message = this.nextString()
      val.completion_message = this.nextString()
    }
    return val
  }

  nextEvent(ctx) {
    const val = {}
    val.name = this.nextString()
    val.message = this.nextString()
    val.resources = Array(7).fill().map(_ => { return this.nextInt() })
    val.applies_to_players = this.nextByte()
    if (ctx.format >= FORMAT.SOD) {
      val.applies_to_human = this.nextByte()
    }
    val.applies_to_computer = this.nextByte()
    val.first_occurence = this.nextShort()
    val.subsequent_occurences = this.nextByte()
    val.unknown = Array(17).fill().map(_ => { return this.nextByte() })
    val.buildings = Array(6).fill().map(_ => { return this.nextByte() })
    val.creatures = Array(7).fill().map(_ => { return this.nextShort() })
    val.unknown1 = Array(4).fill().map(_ => { return this.nextByte() })
    return val
  }

  nextEvents(ctx) {
    return Array(this.nextInt()).fill().map(_ => { return this.nextEvent(ctx) })
  }
}

files.forEach(file => {
  //console.log(file)
  if (file == 'Manifest Destiny.h3m') {
    const map = {}
    const reader = new H3mReader(file)

    map.format = reader.nextInt()
    map.has_hero = reader.nextBool()
    map.size = reader.nextInt()
    map.has_second_level = reader.nextBool()
    map.name = reader.nextString()
    map.description = reader.nextString()
    map.difficulty = reader.nextByte()

    if (map.format >= FORMAT.AB) {
      map.mastery_cap = reader.nextByte()
    }

    map.players = Array(8).fill().map(_ => {
      const player = {}
      player.can_be_human = reader.nextBool()
      player.can_be_computer = reader.nextBool()
      player.behavior = reader.nextByte()
      if (map.format >= FORMAT.SOD) {
        player.allowed_alignments = reader.nextByte()
      }
      player.town_types = reader.nextByte()
      if (map.format >= FORMAT.AB) {
        player.town_conflux = reader.nextByte()
      }
      player.unknown = reader.nextByte()
      player.has_main_town = reader.nextBool()

      if (player.has_main_town) {
        if (map.format >= FORMAT.AB) {
          player.starting_town_create_hero = reader.nextByte()
          player.starting_town_type = reader.nextByte()
        }
        player.starting_town_xpos = reader.nextByte()
        player.starting_town_ypos = reader.nextByte()
        player.starting_town_zpos = reader.nextByte()
      }

      player.starting_hero_is_random = reader.nextBool()
      player.starting_hero_type = reader.nextByte()

      if (player.starting_hero_type != 0xFF || map.format >= FORMAT.AB) {
        player.starting_hero_face = reader.nextByte()
        player.starting_hero_name = reader.nextString()
      }
      return player
    })

    const special_win_condition = {}
    special_win_condition.id = reader.nextByte()

    switch(special_win_condition.id) {
      case SPECIAL_WIN_CONDITION.ACQUIRE_ARTIFACT:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        if (map.format == FORMAT.ROE) {
          special_win_condition.type = reader.nextByte()
        } else {
          special_win_condition.type = reader.nextShort()
        }
        break
      case SPECIAL_WIN_CONDITION.ACCUMULATE_CREATURES:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        if (map.format == FORMAT.ROE) {
          special_win_condition.type = reader.nextByte()
        } else {
          special_win_condition.type = reader.nextShort()
        }
        special_win_condition.amount = reader.nextInt()
        break
      case SPECIAL_WIN_CONDITION.ACCUMULATE_RESOURCES:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        /*****************************
         * type:                     *
         * 0 - Wood     4 - Crystal  *
         * 1 - Mercury  5 - Gems     *
         * 2 - Ore      6 - Gold     *
         * 3 - Sulfur                *
         *****************************/
        special_win_condition.type = reader.nextByte()
        special_win_condition.amount = reader.nextInt()
        break
      case SPECIAL_WIN_CONDITION.UPGRADE_TOWN:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        special_win_condition.xpos = reader.nextByte()
        special_win_condition.ypos = reader.nextByte()
        special_win_condition.zpos = reader.nextByte()
        special_win_condition.hall_level = reader.nextByte()
        special_win_condition.castle_level = reader.nextByte()
        break
      case SPECIAL_WIN_CONDITION.BUILD_GRAIL:
      case SPECIAL_WIN_CONDITION.DEFEAT_HERO:
      case SPECIAL_WIN_CONDITION.CAPTURE_TOWN:
      case SPECIAL_WIN_CONDITION.DEFEAT_MONSTER:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        special_win_condition.xpos = reader.nextByte()
        special_win_condition.ypos = reader.nextByte()
        special_win_condition.zpos = reader.nextByte()
        break
      case SPECIAL_WIN_CONDITION.FLAG_DWELLINGS:
      case SPECIAL_WIN_CONDITION.FLAG_MINES:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        break
      case SPECIAL_WIN_CONDITION.TRANSPORT_ARTIFACT:
        special_win_condition.allow_normal_win = reader.nextBool()
        special_win_condition.applies_to_computer = reader.nextBool()
        special_win_condition.type = reader.nextByte()
        special_win_condition.xpos = reader.nextByte()
        special_win_condition.ypos = reader.nextByte()
        special_win_condition.zpos = reader.nextByte()
        break
    }
    map.special_win_condition = special_win_condition

    const special_loss_condition = {}
    special_loss_condition.id = reader.nextByte()

    switch(special_loss_condition.id) {
      case SPECIAL_LOSS_CONDITION.LOSE_TOWN:
      case SPECIAL_LOSS_CONDITION.LOSE_HERO:
        special_loss_condition.xpos = reader.nextByte()
        special_loss_condition.ypos = reader.nextByte()
        special_loss_condition.zpos = reader.nextByte()
        break
      case SPECIAL_LOSS_CONDITION.TIME:
        special_loss_condition.days = reader.nextShort()
        break
    }
    map.special_loss_condition = special_loss_condition

    if (reader.nextBool()) {
      map.teams = Array(8).fill().map(_ => { return reader.nextByte() })
    }
    if (map.format == FORMAT.ROE) {
      map.available_heroes = Array(16).fill().map(_ => { return reader.nextByte() })
    } else {
      map.available_heroes = Array(20).fill().map(_ => { return reader.nextByte() })
    }
    if (map.format >= FORMAT.AB) {
      map.placeholder_heroes_count = reader.nextInt()
    }
    if (map.format >= FORMAT.SOD) {
      map.custom_heroes = Array(reader.nextByte()).fill().map(_ => {
        const custom_hero = {}
        custom_hero.type = reader.nextByte()
        custom_hero.face = reader.nextByte()
        custom_hero.name = reader.nextString()
        custom_hero.allowed_players = reader.nextByte()
        return custom_hero
      })
    }
    map.reserved = Array(31).fill().map(_ => { return reader.nextByte() })
    if (map.format == FORMAT.AB) {
      map.available_artifacts = Array(17).fill().map(_ => { return reader.nextByte() })
    } else if (map.format >= FORMAT.SOD) {
      map.available_artifacts = Array(18).fill().map(_ => { return reader.nextByte() })
    }
    if (map.format >= FORMAT.SOD) {
      map.available_spells = Array(9).fill().map(_ => { return reader.nextByte() })
      map.available_skills = Array(4).fill().map(_ => { return reader.nextByte() })
    }
    map.rumors = Array(reader.nextInt()).fill().map(_ => {
      const rumor = {}
      rumor.name = reader.nextString()
      rumor.description = reader.nextString()
      return rumor
    })
    if (map.format >= FORMAT.SOD) {
      map.hero_settings = Array(156).fill().map(_ => {
        const hero = {}
        if (reader.nextBool()) {
          if (reader.nextBool()) {
            hero.experience = reader.nextInt()
          }
          // face?
          if (reader.nextBool()) {
            hero.secondary_skills = reader.nextSecondarySkills()
          }
          if (reader.nextBool()) {
            hero.artifacts = reader.nextArtifacts()
            hero.backpack = Array(reader.nextShort()).fill().map(_ => { return reader.nextArtifact(map) })
          }
          if (reader.nextBool()) {
            hero.biography = reader.nextString()
          }
          hero.gender = reader.nextByte()
          if (reader.nextBool()) {
            hero.spells = Array(9).fill().map(_ => { return reader.nextByte() })
          }
          if (reader.nextBool()) {
            hero.primary_skills = reader.nextPrimarySkills()
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
      tile.terrain_type = reader.nextByte()
      tile.terrain_sprite = reader.nextByte()
      tile.river_type = reader.nextByte()
      tile.river_sprite = reader.nextByte()
      tile.road_type = reader.nextByte()
      tile.road_sprite = reader.nextByte()
      tile.mirroring = reader.nextByte()
      return tile
    })

    map.object_attributes = Array(reader.nextInt()).fill().map(_ => {
      const object_attribute = {}
      object_attribute.def = reader.nextString()
      // The passable and active arrays are bitfields representing an 8x6 tile
      // region where bit 1 marks passable and bit 0 impassable. Counting goes
      // from left to right downwards towards the bottom right corner. This means
      // that first bit in passable[0] is [x-7, y-5] from bottom right corner and
      // last bit in passable[6] is the bottom right corner.
      object_attribute.passable = Array(6).fill().map(_ => { return reader.nextByte() })
      object_attribute.active = Array(6).fill().map(_ => { return reader.nextByte() })
      object_attribute.allowed_landscapes = reader.nextShort()
      object_attribute.landscape_group = reader.nextShort()
      object_attribute.object_class = reader.nextInt()
      object_attribute.object_class_name = Object.keys(OBJECT_CLASS).find(key => { return OBJECT_CLASS[key] == object_attribute.object_class })
      object_attribute.object_number = reader.nextInt()
      // 1 - towns  2 - monsters  5 - treasure
      // 3 - heroes 4 - artifacts
      object_attribute.object_group = reader.nextByte()
      object_attribute.above = reader.nextByte()
      object_attribute.unknown = Array(16).fill().map(_ => { return reader.nextByte() })
      return object_attribute
    })

    // TODO: https://github.com/potmdehex/homm3tools/blob/5687f581a4eb5e7b0e8f48794d7be4e3b0a8cc8b/h3m/h3mlib/h3m_parsing/parse_oa.c#L108

    const object_definitions = Array(reader.nextInt()).fill().map(_ => {
      const object_definition = {}
      object_definition.x = reader.nextByte()
      object_definition.y = reader.nextByte()
      object_definition.z = reader.nextByte()
      object_definition.object_attributes_index = reader.nextInt()
      object_definition.unknown = Array(5).fill().map(_ => { return reader.nextByte() })

      const object_attribute = map.object_attributes[object_definition.object_attributes_index]
      const object_class = object_attribute.object_class

      console.log(object_attribute.object_class_name)

      switch(object_class) {
        case OBJECT_CLASS.HERO_PLACEHOLDER:
          object_definition.object_class_group_name = 'HERO_PLACEHOLDER'
          object_definition.owner = reader.nextByte()
          object_definition.type = reader.nextByte()
          if (object_definition.type == 0xFF) {
            object_definition.power_rating = reader.nextByte()
          }
          break
        case OBJECT_CLASS.QUEST_GUARD:
          object_definition.object_class_group_name = 'QUEST_GUARD'
          object_definition.quest = reader.nextQuest(map)
          break
        case OBJECT_CLASS.EVENT:
        case OBJECT_CLASS.PANDORAS_BOX:
          object_definition.object_class_group_name = 'EVENT'
          if (reader.nextBool()) {
            object_definition.message = reader.nextString()
            if (reader.nextBool()) {
              object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
            }
            object_definition.unknown = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          object_definition.experience = reader.nextInt()
          object_definition.morale = reader.nextByte()
          object_definition.luck = reader.nextByte()
          object_definition.morale = reader.nextByte()
          object_definition.resources = Array(7).fill().map(_ => { return reader.nextInt() })
          object_definition.primary_skills = reader.nextPrimarySkills()
          object_definition.secondary_skills = reader.nextSecondarySkills()
          object_definition.artifacts = Array.fill(reader.nextByte()).map(_ => { return reader.nextArtifact(map) })
          object_definition.spells = Array.fill(reader.nextByte()).map(_ => { return reader.nextByte() })
          object_definition.creatures = Array.fill(reader.nextByte()).map(_ => { reader.nextCreature(map) })
          object_definition.unknown = Array(8).fill().map(_ => { return reader.nextByte() })
          if (object_class == OBJECT_CLASS.EVENT) {
            object_definition.applies_to_players = reader.nextByte()
            object_definition.applies_to_computer = reader.nextByte()
            object_definition.cancel_after_visit = reader.nextByte()
            object_definition.unknown1 = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          break
        case OBJECT_CLASS.SIGN:
        case OBJECT_CLASS.OCEAN_BOTTLE:
          object_definition.object_class_group_name = 'SIGN'
          object_definition.message = reader.nextString()
          object_definition.unknown = Array(4).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.GARRISON:
        case OBJECT_CLASS.GARRISON2:
          object_definition.object_class_group_name = 'GARRISON'
          object_definition.owner = reader.nextInt()
          object_definition.creatures = Array(7).fill().map(_ => { reader.nextCreature(map) })
          if (map.format >= FORMAT.AB) {
            object_definition.removable_units = reader.nextByte()
          }
          object_definition.unknown = Array(8).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.GRAIL:
          object_definition.object_class_group_name = 'GRAIL'
          object_definition.allowable_radius = reader.nextInt()
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
          object_definition.owner = reader.nextInt()
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
            object_definition.id = reader.nextInt()
          }
          object_definition.owner = reader.nextByte()
          if (reader.nextBool()) {
            object_definition.name = reader.nextString()
          }
          if (reader.nextBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
          }
          object_definition.formation = reader.nextByte()
          if (reader.nextBool()) {
            object_definition.built_buildings = Array(6).fill().map(_ => { return reader.nextByte() })
            object_definition.disabled_buildings = Array(6).fill().map(_ => { return reader.nextByte() })
          } else {
            object_definition.has_fort = reader.nextBool()
          }
          if (map.format >= FORMAT.AB) {
            object_definition.must_have_spells = Array(9).fill().map(_ => { return reader.nextByte() })
          }
          object_definition.may_have_spells = Array(9).fill().map(_ => { return reader.nextByte() })
          object_definition.events = reader.nextEvents(map)
          if (map.format >= FORMAT.SOD) {
            object_definition.alignment = reader.nextByte()
          }
          object_definition.unknown = Array(3).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.RANDOM_DWELLING:
        case OBJECT_CLASS.RANDOM_DWELLING_FACTION:
        case OBJECT_CLASS.RANDOM_DWELLING_LVL:
          object_definition.object_class_group_name = 'RANDOM_DWELLING'
          object_definition.owner = reader.nextInt()
          if (object_class != OBJECT_CLASS.RANDOM_DWELLING_FACTION) {
            object_definition.castle_id = reader.nextInt()
            if (object_definition.castle_id == 0) {
              object_definition.alignments = Array(2).fill().map(_ => { return reader.nextByte() })
            }
          }
          if (object_class != OBJECT_CLASS.RANDOM_DWELLING_LVL) {
            object_definition.min_level = reader.nextByte()
            object_definition.max_level = reader.nextByte()
          }
          break
        case OBJECT_CLASS.HERO:
        case OBJECT_CLASS.RANDOM_HERO:
        case OBJECT_CLASS.PRISON:
          object_definition.object_class_group_name = 'HERO'
          if (map.format >= FORMAT.AB) {
            object_definition.id = reader.nextInt()
          }
          object_definition.owner = reader.nextByte()
          object_definition.type = reader.nextByte()
          if (reader.nextBool()) {
            object_definition.name = reader.nextString()
          }
          if (map.format >= FORMAT.SOD) {
            if (reader.nextBool()) {
              object_definition.experience = reader.nextInt()
            }
          } else {
            object_definition.experience = reader.nextInt()
          }
          if (reader.nextBool()) {
            object_definition.face = reader.nextByte()
          }
          if (reader.nextBool()) {
            object_definition.secondary_skills = reader.nextSecondarySkills()
          }
          if (reader.nextBool()) {
            object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
          }
          object_definition.formation = reader.nextByte()
          if (reader.nextBool()) {
            object_definition.artifacts = reader.nextArtifacts()
            object_definition.backpack = Array(reader.nextShort()).fill().map(_ => { return reader.nextArtifact(map) })
          }
          object_definition.patrol_radius = reader.nextByte()
          if (map.format >= FORMAT.AB) {
            if (reader.nextBool()) {
              object_definition.biography = reader.nextString()
            }
            object_definition.gender = reader.nextByte()
          }
          if (map.format == FORMAT.AB) {
            object_definition.spells = [reader.nextByte()]
          } else if (map.format >= FORMAT.SOD) {
            if (reader.nextBool()) {
              object_definition.spells = Array(9).fill().map(_ => { return reader.nextByte() })
            }
          }
          if (map.format >= FORMAT.SOD) {
            if (reader.nextBool()) {
              object_definition.primary_skills = reader.nextPrimarySkills()
            }
          }
          object_definition.unknown = Array(16).fill().map(_ => { return reader.nextByte() })
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
            object_definition.id = reader.nextInt()
          }
          object_definition.quantity = reader.nextShort()
          object_definition.disposition = reader.nextByte()
          if (reader.nextBool()) {
            object_definition.message = reader.nextString()
            object_definition.resources = Array(7).fill().map(_ => { return reader.nextInt() })
            object_definition.artifact = reader.nextArtifact(map)
          }
          object_definition.never_flees = reader.nextByte()
          object_definition.does_not_grow = reader.nextByte()
          object_definition.unknown = Array(2).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.ARTIFACT:
        case OBJECT_CLASS.RANDOM_ART:
        case OBJECT_CLASS.RANDOM_TREASURE_ART:
        case OBJECT_CLASS.RANDOM_MINOR_ART:
        case OBJECT_CLASS.RANDOM_MAJOR_ART:
        case OBJECT_CLASS.RANDOM_RELIC_ART:
          object_definition.object_class_group_name = 'ARTIFACT'
          if (reader.nextBool()) {
            object_definition.message = reader.nextString()
            if (reader.nextBool()) {
              object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
            }
            object_definition.unknown = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          break
        case OBJECT_CLASS.SHRINE_OF_MAGIC_INCANTATION:
        case OBJECT_CLASS.SHRINE_OF_MAGIC_GESTURE:
        case OBJECT_CLASS.SHRINE_OF_MAGIC_THOUGHT:
          object_definition.object_class_group_name = 'SHRINE_OF_MAGIC'
          object_definition.spell = reader.nextInt()
          break
        case OBJECT_CLASS.SPELL_SCROLL:
          object_definition.object_class_group_name = 'SPELL_SCROLL'
          if (reader.nextBool()) {
            object_definition.message = reader.nextString()
            if (reader.nextBool()) {
              object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
            }
            object_definition.unknown = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          object_definition.spell = reader.nextInt()
          break
        case OBJECT_CLASS.RESOURCE:
        case OBJECT_CLASS.RANDOM_RESOURCE:
          object_definition.object_class_group_name = 'RESOURCE'
          if (reader.nextBool()) {
            object_definition.message = reader.nextString()
            if (reader.nextBool()) {
              object_definition.creatures = Array(7).fill().map(_ => { return reader.nextCreature(map) })
            }
            object_definition.unknown = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          object_definition.quantity = reader.nextInt()
          object_definition.unknown1 = Array(4).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.WITCH_HUT:
          object_definition.object_class_group_name = 'WITCH_HUT'
          if (map.format >= FORMAT.AB) {
            object_definition.potential_skills = Array(4).fill().map(_ => { return reader.nextByte() })
          }
          break
        case OBJECT_CLASS.SEER_HUT:
          object_definition.object_class_group_name = 'SEER_HUT'
          if (map.format == FORMAT.ROE) {
            object_definition.artifact = reader.nextByte()
          } else {
            object_definition.quest = reader.nextQuest(map)
          }
          object_definition.reward_type = reader.nextByte()
          switch(object_definition.reward_type) {
            case REWARD_TYPE.EXPERIENCE:
            case REWARD_TYPE.SPELL_POINTS:
              object_definition.reward = Array(4).fill().map(_ => { return reader.nextByte() })
              break
            case REWARD_TYPE.ARTIFACT:
              if (map.format == FORMAT.ROE) {
                object_definition.reward = Array(1).fill().map(_ => { return reader.nextByte() })
              } else {
                object_definition.reward = Array(2).fill().map(_ => { return reader.nextByte() })
              }
              break
            case REWARD_TYPE.LUCK:
            case REWARD_TYPE.MORALE:
            case REWARD_TYPE.SPELL:
              object_definition.reward = Array(1).fill().map(_ => { return reader.nextByte() })
              break
            case REWARD_TYPE.RESOURCE:
              object_definition.reward = Array(5).fill().map(_ => { return reader.nextByte() })
              break
            case REWARD_TYPE.PRIMARY_SKILL:
            case REWARD_TYPE.SECONDARY_SKILL:
              object_definition.reward = Array(2).fill().map(_ => { return reader.nextByte() })
              break
            case REWARD_TYPE.CREATURE:
              if (map.format == FORMAT.ROE) {
                object_definition.reward = Array(3).fill().map(_ => { return reader.nextByte() })
              } else {
                object_definition.reward = Array(4).fill().map(_ => { return reader.nextByte() })
              }
              break
          }
          object_definition.unknown = Array(2).fill().map(_ => { return reader.nextByte() })
          break
        case OBJECT_CLASS.SCHOLAR:
          object_definition.object_class_group_name = 'SCHOLAR'
          object_definition.reward_type = reader.nextByte()
          object_definition.reward_value = reader.nextByte()
          object_definition.unknown = Array(6).fill().map(_ => { return reader.nextByte() })
          break
      }
      console.log(object_definition)
      return object_definition
    })
    map.object_definitions = object_definitions

    map.events = reader.nextEvents(map)

    console.log(map)

  }
})
