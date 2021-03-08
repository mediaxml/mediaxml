const chalk = require('chalk')
const ora = require('ora')

class UI {
  constructor(context) {
    this.context = context
    this.spinners = {
      loading: ora({
        discardStdin: false,
        hideCursor: false,
        indent: 0,
        spinner: 'aesthetic',
        color: 'cyan',
        prefixText: `${chalk.bold(chalk.italic('loading'))}:`,

        ...context.options.ui.loading
      })
    }
  }
}

module.exports = {
  UI
}
