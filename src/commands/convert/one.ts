import {Command, flags} from '@oclif/command'

export default class ConvertOne extends Command {
  static description = 'converts HoMM3 h3m file to Tiled json map file'

  static examples = [
    `$ homm3-tiled convert 'Manifest Destiny'`,
  ]

  static args = [{name: 'name of the h3m file to convert'}]

  async run() {
    const {args} = this.parse(ConvertOne)

    if (args.file) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
