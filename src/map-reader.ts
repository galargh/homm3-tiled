import BinaryReader from './binary-reader'
import {
  FORMAT,
  QUEST_TYPE
} from './constants'

export default class MapReader extends BinaryReader {
  readPrimarySkills() {
    const val = {} as any
    val.attack_skill = this.readByte()
    val.defense_skill = this.readByte()
    val.spell_power = this.readByte()
    val.knowledge = this.readByte()
    return val
  }

  readSecondarySkills() {
    return Array(this.readByte()).fill(undefined).map(_ => {
      const val = {} as any
      val.type = this.readByte()
      val.level = this.readByte()
      return val
    })
  }

  readCreature(ctx) {
    const val = {} as any
    if (ctx.format == FORMAT.ROE) {
      val.type = this.readByte()
    } else {
      val.type = this.readShort()
    }
    // type != 0xFF
    val.quantity = this.readShort()
    return val
  }

  readArtifact(ctx) {
    if (ctx.format == FORMAT.ROE) {
      return this.readByte()
    } else {
      return this.readShort()
    }
  }

  readArtifacts(ctx) {
    if (ctx.format < FORMAT.SOD) {
      return Array(18).fill(undefined).map(_ => { return this.readArtifact(ctx) })
    } else {
      return Array(19).fill(undefined).map(_ => { return this.readArtifact(ctx) })
    }
  }

  readQuest(ctx) {
    const val = {} as any
    val.type = this.readByte()
    if (val.type != 0xFF) {
      switch(val.type) {
        case QUEST_TYPE.EXPERIENCE:
          val.experience = this.readInt()
          break
        case QUEST_TYPE.PRIMARY_SKILLS:
          val.primary_skills = this.readPrimarySkills()
          break
        case QUEST_TYPE.DEFEAT_HERO:
          val.hero_id = this.readInt()
          break
        case QUEST_TYPE.DEFEAT_MONSTER:
          val.quest_monster_id = this.readInt()
          break
        case QUEST_TYPE.ARTIFACTS:
          val.artifacts = Array(this.readByte()).fill(undefined).map(_ => { return this.readArtifact(ctx) })
          break
        case QUEST_TYPE.CREATURES:
          val.creatures = Array(this.readByte()).fill(undefined).map(_ => { return this.readCreature(ctx) })
          break
        case QUEST_TYPE.RESOURCES:
          val.resources = Array(7).fill(undefined).map(_ => { return this.readInt() })
          break
        case QUEST_TYPE.BE_HERO:
          val.quest_hero_type = this.readByte()
          break
        case QUEST_TYPE.BE_PLAYER:
          val.quest_player_flag = this.readByte()
          break
      }
    }
    val.deadline = ctx.readInt()
    if (val.quest.type != 0xFF && ctx.format >= FORMAT.SOD) {
      val.proposal_messaage = this.readString(this.readInt())
      val.progress_message = this.readString(this.readInt())
      val.completion_message = this.readString(this.readInt())
    }
    return val
  }

  readEvent(ctx) {
    const val = {} as any
    val.name = this.readString(this.readInt())
    val.message = this.readString(this.readInt())
    val.resources = Array(7).fill(undefined).map(_ => { return this.readInt() })
    val.applies_to_players = this.readByte()
    if (ctx.format >= FORMAT.SOD) {
      val.applies_to_human = this.readByte()
    }
    val.applies_to_computer = this.readByte()
    val.first_occurence = this.readShort()
    val.subsequent_occurences = this.readByte()
    val.unknown = Array(17).fill(undefined).map(_ => { return this.readByte() })
    val.buildings = Array(6).fill(undefined).map(_ => { return this.readByte() })
    val.creatures = Array(7).fill(undefined).map(_ => { return this.readShort() })
    val.unknown1 = Array(4).fill(undefined).map(_ => { return this.readByte() })
    return val
  }

  readEvents(ctx) {
    return Array(this.readInt()).fill(undefined).map(_ => { return this.readEvent(ctx) })
  }
}

module.exports = MapReader
