import BinaryReader from './BinaryReader'
import Format from '../enums/Format'
import QuestType from '../enums/QuestType'

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

  readCreature(ctx: any) {
    const val = {} as any
    if (ctx.format == Format.ROE) {
      val.type = this.readByte()
    } else {
      val.type = this.readShort()
    }
    // type != 0xFF
    val.quantity = this.readShort()
    return val
  }

  readArtifact(ctx: any) {
    if (ctx.format == Format.ROE) {
      return this.readByte()
    } else {
      return this.readShort()
    }
  }

  readArtifacts(ctx: any) {
    if (ctx.format < Format.SOD) {
      return Array(18).fill(undefined).map(_ => { return this.readArtifact(ctx) })
    } else {
      return Array(19).fill(undefined).map(_ => { return this.readArtifact(ctx) })
    }
  }

  readQuest(ctx: any) {
    const val = {} as any
    val.type = this.readByte()
    if (val.type != 0xFF) {
      switch(val.type) {
        case QuestType.EXPERIENCE:
          val.experience = this.readInt()
          break
        case QuestType.PRIMARY_SKILLS:
          val.primary_skills = this.readPrimarySkills()
          break
        case QuestType.DEFEAT_HERO:
          val.hero_id = this.readInt()
          break
        case QuestType.DEFEAT_MONSTER:
          val.quest_monster_id = this.readInt()
          break
        case QuestType.ARTIFACTS:
          val.artifacts = Array(this.readByte()).fill(undefined).map(_ => { return this.readArtifact(ctx) })
          break
        case QuestType.CREATURES:
          val.creatures = Array(this.readByte()).fill(undefined).map(_ => { return this.readCreature(ctx) })
          break
        case QuestType.RESOURCES:
          val.resources = Array(7).fill(undefined).map(_ => { return this.readInt() })
          break
        case QuestType.BE_HERO:
          val.quest_hero_type = this.readByte()
          break
        case QuestType.BE_PLAYER:
          val.quest_player_flag = this.readByte()
          break
      }
    }
    val.deadline = ctx.readInt()
    if (val.quest.type != 0xFF && ctx.format >= Format.SOD) {
      val.proposal_messaage = this.readString(this.readInt())
      val.progress_message = this.readString(this.readInt())
      val.completion_message = this.readString(this.readInt())
    }
    return val
  }

  readEvent(ctx: any) {
    const val = {} as any
    val.name = this.readString(this.readInt())
    val.message = this.readString(this.readInt())
    val.resources = Array(7).fill(undefined).map(_ => { return this.readInt() })
    val.applies_to_players = this.readByte()
    if (ctx.format >= Format.SOD) {
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

  readEvents(ctx: any) {
    return Array(this.readInt()).fill(undefined).map(_ => { return this.readEvent(ctx) })
  }
}

module.exports = MapReader
