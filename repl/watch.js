const { clearScreenDown, cursorTo, moveCursor } = require('readline')
const { getCursorPreviewPosition } = require('./utils')
const { createPrompt } = require('./prompt')
const InvertedPromise = require('inverted-promise')
const { pretty } = require('./pretty')
const truncate = require('cli-truncate')
const chokidar = require('chokidar')
const { hash } = require('../hash')
const chalk = require('chalk')
const debug = require('debug')('mediaxml')
const { URL } = require('url')
const uri = require('../uri')

async function watch(context, filename) {
  filename = uri.resolve(filename)

  if (!filename) {
    return null
  }

  try {
    const { protocol, pathname } = new URL(filename)
    filename = pathname
    if (protocol && 'file:' !== protocol) {
      context.log.warn('Cannot watch: "%s": Unsupported protocol: "%s"',
        chalk.bold(filename),
        chalk.yellow(protocol)
      )
      return null
    }
  } catch (err) {
    void err
  }

  context.log.info('Watching: "%s"', chalk.bold(filename))

  const watcher = chokidar.watch(filename)
  const promise = new InvertedPromise()

  watcher.on('change', onchange)
  watcher.on('ready', onready)
  watcher.on('error', onerror)

  debug('watch', filename)

  return promise

  function onerror(err) {
    promise.reject(err)
  }

  async function onready() {
    if (context.watcher) {
      await context.watcher.closer()
    }

    promise.resolve(watcher)

    context.watcher = watcher
  }

  async function onchange(pathname) {
    if (pathname !== filename) {
      return
    }

    const cacheKey = hash(filename)
    context.imports.delete(filename)
    context.cache.delete(cacheKey)
    await context.import(filename)

    const { server } = context
    const { cursorPos, displayPos } = getCursorPreviewPosition(server)
    const cols = displayPos.cols - cursorPos.cols
    let result = null

    clearScreenDown(server.output)
    moveCursor(server.output, cols, 0)

    const query = server.line

    if (query) {
      try {
        result = await context.query(query)
      } catch (err) {
        if (err && '(end)' !== err.token && !context.imports.pending.size) {
          throw err
        }
      }
    }

    process.nextTick(() => {
      let output = ''

      const { cursorPos, displayPos } = getCursorPreviewPosition(server)
      const cols = displayPos.cols - cursorPos.cols
      const rows = displayPos.rows - cursorPos.rows

      if (result) {
        output = pretty(result)

        if (output) {
          output = output.split('\n').slice(0, server.output.rows - rows - 1)
          const n = output.length
          output = output
            .map((o) => `${truncate(o, server.output.columns - 8)}`)
            .join('\n')

          moveCursor(server.output, cols, rows)
          clearScreenDown(server.output)
          server.output.write(`${output}`)
          cursorTo(server.output, cursorPos.cols)
          moveCursor(server.output, cols, -rows - n -1)
        }
      } else if (!query || !result) {
        moveCursor(server.output, cols, rows)
        clearScreenDown(server.output)
      }
    })
  }
}

module.exports = {
  watch
}
