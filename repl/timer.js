const prettyMs = require('pretty-ms')
const chalk = require('chalk')

class Timer {
  static now(label) {
    return new this(label, Date.now())
  }

  constructor(label, start) {
    this.label = label
    this.start = start || null
    this.end = null
  }

  start() {
    this.start = Date.now()
    return this
  }

  stop() {
    this.stop = Date.now()
    return this
  }

  get length() {
    if (this.start && this.stop) {
      return this.stop - this.start
    } else if (this.start) {
      return Date.now() - this.start
    }

    return 0
  }

  toString(opts) {
    opts = { ...opts }
    if (false !== opts.colors) {
      return format('%s: %s', chalk.magenta(chalk.bold(this.label)), prettyMs(this.length))
    } else {
      return format('%s: %s', 'query', prettyMs(this.length))
    }
  }
}

module.exports = {
  Timer
}
