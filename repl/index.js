const { clearScreenDown, cursorTo, moveCursor } = require('readline')
const { getCursorPreviewPosition } = require('./utils')
const { Imports, Assignments } = require('../query')
const { createCompleter } = require('./completer')
const { createPrompt } = require('./prompt')
const { createLoader } = require('../loader')
const { validate } = require('../validate')
const { preview } = require('./preview')
const { Parser } = require('../parser')
const { pretty } = require('./pretty')
const { fetch } = require('../fetch')
const { watch } = require('./watch')
const truncate = require('cli-truncate')
// eslint-disable-next-line
const { eval } = require('./eval')
const { Log } = require('./log')
const { UI } = require('./ui')
const mkdirp = require('mkdirp')
const paths = require('env-paths')('mediaxml')
const debug = require('debug')('mediaxml')
const chalk = require('chalk')
const path = require('path')
const repl = require('repl')
const pkg = require('../package.json')

class History {
  constructor(context) {
    this.index = 0
    this.entries = []
    this.context = context
    this.filename = path.join(paths.data, 'repl.history')
  }

  get length() {
    return this.entries.length
  }

  get head() {
    return this.entries[this.index] || null
  }

  init() {
    const { filename, context } = this
    const dirname = path.dirname(filename)
    return new Promise((resolve, reject) => {
      try {
        mkdirp.sync(dirname)
      } catch (err) {
        return reject(err)
      }

      if (context.server) {
        context.server.setupHistory(filename, (err) => {
          if (err) { return reject(err) }
          resolve()
        })
      }
    })
  }

  push(entry) {
    this.entries.push(entry)
    this.next()
  }

  pop() {
    const result = this.entries.pop()
    this.prev()
    return result
  }

  next() {
    this.index = Math.min(this.index + 1, this.length)
  }

  prev() {
    this.index = Math.max(this.index - 1, 0)
  }
}

class Input {
  constructor() {
    this.buffer = []
  }

  push(line) {
    this.buffer.push(line)
  }

  pop() {
    return this.buffer.pop()
  }

  clear() {
    this.buffer.splice(0, this.buffer.length)
  }

  toString() {
    return this.buffer.join('').trim()
  }
}

/**
 * A container for the REPL server and various session context data.
 * @public
 * @memberof repl
 */
class Context {
  static from(...args) {
    return new this(...args)
  }

  /**
   * `Context` class constructor.
   * @protected
   * @constructor
   * @param {?Object} opts
   */
  constructor(opts) {
    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    this.options = {
      terminal: true,
      preview: false !== opts.preview,
      colors: false !== opts.colors,
      watch: true === opts.watch,
      // we'll normalize these values later, so lets make a copy
      argv: [ ...Array.isArray(opts.argv) ? opts.argv : [] ],
      ui: 'object' === typeof opts.ui ? opts.ui : {},

      completer: createCompleter(this),
      eval
    }

    if ('function' === typeof opts.eval) {
      this.options.eval = opts.eval
    }

    if ('function' === typeof opts.completer) {
      this.options.completer = opts.completer
    }

    this.ui = new UI(this)
    this.log = new Log(this)
    this.input = new Input(this)
    this.cache = opts.cache || new Map()
    this.server = opts.server || null
    this.parser = null
    this.watcher = null
    this.history = new History(this)
    this.filename = null
    this.assignments = new Assignments()

    this.imports = new Imports({
      load: opts.load || createLoader(this, { onbeforeload, onload }),
      cwd: opts.cwd || process.cwd()
    })

    this.onexit = this.onexit.bind(this)
    this.onerror = this.onerror.bind(this)
    this.onkeypress = this.onkeypress.bind(this)
    this.handlers = {
      onexit: null,
      onerror: null,
      onkeypress: null
    }

    if ('function' === typeof opts.onexit) {
      this.handlers.onexit = opts.onexit
    }

    if ('function' === typeof opts.onerror) {
      this.handlers.onerror = opts.onerror
    }

    if ('function' === typeof opts.onkeypress) {
      this.handlers.onkeypress = opts.onkeypress
    }

    if (opts.parser) {
      const { parser } = opts
      if (parser.rootNode) {
        this.parser = parser
      } else {
        parser.promise
          .then(() => {
            this.parser.clear()
            this.parser.nodes[0] = parser.rootNode
            this.parser.end()
          })
          .catch((err) => {
            this.log.debug(err.stack || err)
          })
      }
    }

    if (!this.parser) {
      this.parser = Parser.from('<xml></xml>')
    } else if (!this.parser.rootNode) {
      this.parser.clear()
      this.parser.write('<xml></xml>')
      this.parser.end()
    }

    this.assignments.set('cwd', process.cwd())
    this.assignments.set('argv0', this.options.argv[0] || null)
    this.assignments.set('argv1', this.options.argv[1] || null)
    this.assignments.set('argv2', this.options.argv[2] || null)
    this.assignments.set('argv3', this.options.argv[3] || null)
    this.assignments.set('argv4', this.options.argv[4] || null)
    this.assignments.set('path', {
      resolve: path.resolve,
      dirname: path.dirname,
      join: path.join,
      sep: path.sep
    })

    const { ui } = this
    const context = this

    async function onbeforeload(info) {
      debug('onbeforeload', info)

      if (context.options.watch) {
        try {
          await watch(context, info.uri)
        } catch (err) {
          context.onerror(err)
        }
      }

      if (!context.options.watch) {
        ui.spinners.loading.start()
      }
    }

    async function onload(result, info) {
      debug('onload', info)

      if (!context.options.watch) {
        ui.spinners.loading.stop()
      }

      if (info.uri) {
        if (context.server) {
          let prompt = path.basename(info.uri).split('?')[0]

          if (prompt.length > 16) {
            prompt = `${prompt.slice(0, 13)}...`
          }

          context.server.setPrompt(createPrompt('mxml', prompt))
        }
      }

      context.filename = info.uri
    }
  }

  get rootNode() {
    return this.parser.rootNode
  }

  set rootNode(rootNode) {
    if (this.parser.rootNode) {
      this.parser.rootNode.outerXML = rootNode.outerXML
    } else {
      this.parser.nodes[0] = rootNode
    }
  }

  onexit() {
    if (this.watcher) {
      this.watcher.close().catch(this.onerror)
      this.watcher = null
    }

    if ('function' === typeof this.handlers.onexit) {
      this.handlers.onexit()
    }
  }

  onerror(err) {
    this.log.debug(err)

    if ('function' === typeof this.handlers.onerror) {
      this.handlers.onerror(err)
    }
  }

  async onkeypress(line, key, ...args) {
    const { assignments, history, parser, server, imports, input } = this

    if (!key) {
      return
    }

    if ('function' === typeof this.handlers.onkeypress) {
      try {
        this.handlers.onkeypress(line, key, ...args)
      } catch (err) {
        this.onerror(err)
      }
    }

    if (false === this.options.preview) {
      return
    }

    if ('backspace' === key.name && 0 === input.buffer.length) {
      return
    }

    if (key.ctrl) {
      return
    }

    if ('up' === key.name) {
      history.prev()
      key = history.head || key
    } else if ('down' === key.name) {
      history.next()
      key = history.head || key
    } else if ('left' === key.name || 'right' === key.name) {
      return
    }

    if ('backspace' === key.name) {
      input.pop()
    } else if ('return' === key.name) {
      input.clear()
      history.push(key)
      clearScreenDown(server.output)
    } else if (key.sequence) {
      input.push(key.sequence)
    }

    const query = input.toString()
    let result = null

    if (query && query.trim().length > 3) {
      // double wildcards can be expensive
      if ('**' === query.trim()) {
        return
      }

      // don't just preview a print all willy nilly
      if (/\s*?print\s*/.test(query.trim())) {
        return
      }

      // don't try to preview imports and lets
      if (/^\s*?(import|let|if|else)\s*?.*$/.test(query.trim())) {
        return
      }

      try {
        result = await parser.query(query, { imports, assignments })
      } catch (err) {
        debug(err)
      }
    }

    return preview(this, result)
  }

  /**
   * @public
   */
  start() {
    const { filename, options } = this

    console.error(`Welcome to the ${chalk.magenta(chalk.bold('MediaXML'))} %s CLI`, pkg.version)
    console.error('Please report bugs to %s', chalk.bold(chalk.italic(pkg.bugs.url)))

    if (!this.server) {
      this.server = repl.start({
        ...options,
        prompt: createPrompt('mxml', filename && path.basename(filename.split('?')[0])),
      })
    }

    this.server.mxml = this
    this.server.context = this.parser.rootNode

    this.server.on('exit', this.onexit)
    this.server.on('error', this.onerror)

    if ('function' === typeof process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }

    process.stdin.on('error', this.onerror)
    process.stdin.on('keypress', this.onkeypress)

    this.history.init().catch(this.onerror)

  }
  /**
   * @public
   */
  stop() {
    const { server } = this
    this.server = null

    if (server && 'function' === typeof server.close) {
      server.close()
    }

    process.stdin.setRawMode(false)
    process.stdin.removeListener('error', this.onerror)
    process.stdin.removeListener('keypress', this.onkeypress)

    return this
  }

  import(name) {
    return this.query(`import "${name}"`)
  }

  query(queryString, ctx) {
    if (this.parser) {
      return this.parser.query(queryString, ctx || this)
    }

    return null
  }
}

/**
 * Creates a REPL execution context.
 * @memberof repl
 * @public
 * @param {String} filename
 * @param {Object} opts
 * @return {Context}
 */
function createContext(filename, opts) {
  if (Buffer.isBuffer(filename)) {
    filename = String(filename)
  }

  if (filename && 'object' === typeof filename && !filename.pipe) {
    opts = filename
    filename = null
  }

  opts = { ...opts }

  if (filename && !opts.parser) {
    if ('string' === typeof filename) {
      try {
        const tmp = String(filename)
        validate(tmp)
        opts.parser = Parser.from(tmp)
      } catch (err) {
        debug(err)
      }
    }

    if (!opts.parser) {
      if ('string' === typeof filename || filename.pipe) {
        opts.parser = Parser.from(fetch(filename))
      }
    }
  }

  return Context.from(opts)
}

/**
 * Starts a new REPL server for a MediaXML session.
 * @memberof repl
 * @public
 * @param {String} filename
 * @param {Object} opts
 * @return {Context}
 */
function start(filename, opts) {
  return createContext(filename, opts).start()
}

/**
 * A module that provides an API for starting a REPL session for interacting
 * with XML files using query syntax.
 * @public
 * @module repl
 * @example
 * // TODO
 */
module.exports = {
  createContext,
  Context,
  start
}
