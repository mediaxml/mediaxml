const { format } = require('util')
const debug = require('debug')('mediaxml')
const chalk = require('chalk')

class Log {
  constructor(context) {
    this.context = context
  }

  line(type) {
    console[type || 'log']()
  }

  error(...args) {
    if (false !== this.context.options.colors) {
      console.error('%s:', chalk.bold(chalk.red('error')), format(...args))
    } else {
      console.error('error:', format(...args))
    }
  }

  warn(...args) {
    if (false !== this.context.options.colors) {
      console.error(' %s:', chalk.bold(chalk.yellow('warn')), format(...args))
    } else {
      console.error(' warn:', format(...args))
    }
  }

  info() {
    if (false !== this.context.options.colors) {
      console.info(' %s:', chalk.blue('info'), format(...args))
    } else {
      console.info(' info:', format(...args))
    }
  }

  debug(...args) {
    debug(...args)
  }
}

module.exports = {
  Log
}
