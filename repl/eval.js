const { clearScreenDown,  moveCursor } = require('readline')
const { getCursorPreviewPosition } = require('./utils')
const { pretty } = require('./pretty')
const { Timer } = require('./timer')
const chalk = require('chalk')
const repl = require('repl')

let documentNotLoadedWarningShown = false

// eslint-disable-next-line
async function eval(query, context, file, callback) {
  const { assignments, parser, options, imports, server, log } = this.mxml
  const timer = Timer.now('query')
  const cwd = process.cwd()
  let result = null

  query = query.trim()

  if (!query) {
    return callback(null, null)
  }

  if (!query) {
    if (options.timing) {
      log.error(timer.toString({ colors: options.colors }))
    }

    return process.nextTick(callback, null)
  }

  try {
    result = await parser.query(query, { cwd, imports, assignments })

    const output = pretty(result)

    if (!parser.rootNode && !documentNotLoadedWarningShown) {
      documentNotLoadedWarningShown = true
      log.line('error')
      log.warn('Document not loaded into context. The query cannot be executed.')
      log.warn(`Try using \`${chalk.cyan('load')} <URL>\` command to load an XML document into the context.`)
      log.line('error')
    }

    if (output) {
      process.stdout.write(output)
      process.stdout.write('\n')
    }

    if (options.timing) {
      log.error(timer.toString({ colors: options.colors }))
    }

    return process.nextTick(callback, null)
  } catch (err) {
    log.debug(err || err.stack)

    const { cursorPosition, displayPosition } = getCursorPreviewPosition(server)
    const cols = displayPosition.cols - cursorPosition.cols
    const rows = displayPosition.rows - cursorPosition.rows

    moveCursor(server.output, cols, rows + 1)
    clearScreenDown(server.output)

    if (err && ['S0101', 'S0105'].includes(err.code)) {
      return process.nextTick(callback, new repl.Recoverable(err))
    } else if (err && '(end)' === err.token) {
      return process.nextTick(callback, new repl.Recoverable(err))
    }

    if (err && 'number' === typeof err.position) {
      if (err.token) {
        log.error(chalk.bold(err.message.replace(`"${err.token}"`, `"${chalk.yellow(err.token)}"`)))
      } else {
        log.error(chalk.bold(err.message))
      }

      if (options.timing) {
        log.error(timer.toString({ colors: options.colors }))
      }

      process.nextTick(callback, null)
    } else {
      log.debug(err.stack || err)

      if (options.timing) {
        log.error(timer.toString({ colors: options.colors }))
      }

      process.nextTick(callback, err.message || err)
    }
  }
}

module.exports = {
  eval
}
