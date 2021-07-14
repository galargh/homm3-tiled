import Command from "../Command"
import * as fs from 'fs'
import Logger from "../Logger"

export default class Clean extends Command {
  static description = 'cleans the data that stores extracted def, lod and h3m files'

  async run() {
    if (fs.existsSync(this.config.dataDir)) {
      Logger.info(`Going to remove the data directory ${this.config.dataDir}...`)
      fs.rmSync(this.config.dataDir, {recursive: true})
      Logger.info(`The data directory ${this.config.dataDir} has been successfuly removed!`)
    } else {
      Logger.info(`The data directory ${this.config.dataDir} does not exist. There is nothing to clean.`)
    }
  }
}
