import LogLevel from './enums/LogLevel'

export default class Logger {
  private static logLevel: LogLevel = LogLevel.INFO

  private constructor() {}

  static setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  static log(logLevel: LogLevel, ...data: any[]) {
    if (logLevel >= this.logLevel) {
      console.log(`[{logLevel}]`, data)
    }
  }

  static debug(...data: any[]) {
    this.log(LogLevel.DEBUG, data)
  }

  static info(...data: any[]) {
    this.log(LogLevel.INFO, data)
  }

  static warn(...data: any[]) {
    this.log(LogLevel.WARN, data)
  }

  static error(...data: any[]) {
    this.log(LogLevel.ERROR, data)
  }
}
