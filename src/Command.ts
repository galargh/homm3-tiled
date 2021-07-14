import {Command as OCommand, flags} from '@oclif/command'
import LogLevel from './enums/LogLevel'
import Logger from './Logger'

export default abstract class Command extends OCommand {
  static flags = {
    loglevel: flags.string({options: Object.keys(LogLevel), default: LogLevel.INFO.toString()})
  }

  async init() {
    const {flags} = this.parse(Command)
    Logger.setLogLevel(LogLevel[flags.loglevel as keyof typeof LogLevel])
    if (process.env.HOMM3_HOME) {
      this.error('Please set HOMM3_HOME env var. It should point at the home directory of your Heroes of Might and Magic 3 installation.')
    }
  }
}
