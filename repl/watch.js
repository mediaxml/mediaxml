const { clearScreenDown, moveCursor } = require('readline')
const { getCursorPreviewPosition } = require('./utils')
const { preview } = require('./preview')
const chokidar = require('chokidar')
const { hash } = require('../hash')
const { URL } = require('url')
const chalk = require('chalk')
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

  const watcher = context.watcher || chokidar.watch()

  if (!context.watcher) {
    watcher.on('ready', onready)
  }

  watcher.add(filename)

  return watcher

  function onerror(err) {
    context.onerror(err)
  }

  async function onready() {
    if (context.watcher) {
      await context.watcher.closer()
    }

    context.watcher = watcher
    watcher.on('change', onchange)
    watcher.on('error', onerror)
    watcher.on('add', onadd)
  }

  function onadd(pathname) {
    if (pathname === filename) {
      context.log.info('Watching: "%s"', chalk.bold(filename))
    }
  }

  async function onchange(pathname) {
    if (pathname !== filename) {
      return
    }

    const { server } = context
    const cacheKey = hash(filename)
    const query = server.line || '$'
    let result = null

    // clear imports map and loader cache before importing
    context.imports.delete(filename)
    context.cache.delete(cacheKey)
    await context.import(filename)

    if (query) {
      try {
        result = await context.query(query)
      } catch (err) {
        if (err && '(end)' !== err.token && !context.imports.pending.size) {
          throw err
        }
      }
    }

    preview(context, result)
  }
}

module.exports = {
  watch
}
