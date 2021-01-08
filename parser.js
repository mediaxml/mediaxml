const { WritableStream } = require('htmlparser2/lib/WritableStream')
const htmlparser2 = require('htmlparser2')
const { inspect } = require('util')
const jsonata = require('jsonata')
const debug = require('debug')('scte236:parser')

/**
 * An internal cache used by the parser.
 * @private
 */
const cache = new Map()

/**
 * A container for a parsed XML node with references to
 * its parent node and children.
 * @public
 * @class ParserNode
 */
class ParserNode {

  /**
   * `ParserNode` class constructor.
   * @param {String} name
   * @param {?(Object)} attributes
   * @param {?(Number)} depth
   */
  constructor(name, attributes, depth) {
    this.name = name.toLowerCase()
    this.body = null
    this.depth = depth || 0
    this.parent = null
    this.children = []
    this.comments = []
    this.attributes = normalizeAttributes(attributes)
    this.originalName = name
    this.originalAttributes = attributes

    function normalizeAttributes(attrs) {
      if (!attrs) { return {} }
      const reduce = (a, k) => ({ ...a, [k]: normalizeAttributeValue(attrs[k]) })
      return Object
        .keys(attrs)
        .reduce(reduce, {})
    }

    function normalizeAttributeValue(attr) {
      if ('true' === attr) {
        return true
      } else if ('false' === attr) {
        return false
      } else if ('null' === attr) {
        return null
      } else if (!Number.isNaN(parseFloat(attr))) {
        return parseFloat(attr)
      } else {
        return attr
      }
    }
  }

  /**
   * Appends a child node to this node.
   * @param {ParserNode} node
   */
  appendChild(node) {
    node.parent = this
    this.children.push(node)
  }

  /**
   * Removes a child node to this node.
   * @param {ParserNode} node
   */
  removeChild(node) {
    const index = this.children.indexOf(node)
    if (-1 !== index) {
      node.parent = null
      this.children.splice(index, 1)
    }
  }

  /**
   * Converts this node ands children to a XML string
   * representing this node and its children.
   * @param {?(Object)} opts
   * @param {?(Boolean)} [opts.attributes = true] - Include attributes in the result
   * @param {?(Boolean)} [opts.normalize = false] - Normalize tag and attributes names
   * @param {?(Boolean)} [opts.children = true] - Include children in the result
   * @param {?(Boolean)} [opts.body = true] - Include node body in the result
   * @param {?(Number)} [opts.depth = 0] - The starting depth of this node
   * @return {String}
   */
  toString(opts) {
    opts = { ...opts }

    if (opts.normalize) {
      var { name, attributes } = this
    } else {
      var { originalName: name, originalAttributes: attributes } = this
    }

    const { body, children } = this
    const { depth = 0 } = opts
    const indent = ''.padStart(2*depth, ' ')

    // key="value"
    const serializedAttributes = false !== opts.attributes && Object
      .keys(attributes)
      .map((key) => serializeAttribute(key, attributes[key]))
      .join(' ')
      .trim()

    let selfClosingTag = ''
    let output = ''

    if ((!body || false === opts.body) && (!children.length || false === opts.children)) {
      selfClosingTag = '/'
    }

    output += `${indent}<${[name, serializedAttributes, selfClosingTag].filter(Boolean).join(' ')}>`

    if (body && false !== opts.body) {
      output += body.trim()
    }

    if (false !== opts.children && children && children.length) {
      output += '\n'
      output += children
        .filter(Boolean)
        .map((child) => child.toString({ ...opts, depth: depth + 1 }))
        .join('\n')
    }

    if (body && false !== opts.body && false !== opts.children && children && children.length) {
      if ('\n' !== output.slice(-1)[0]) {
        output += '\n'
      }
    } else if (!selfClosingTag && children && children.length) {
      output += '\n'
    }

    if (!selfClosingTag) {
      if (children && children.length) {
        output += `${indent}</${name}>`
      } else if (body) {
        output += `</${name}>`
      }
    }

    return output

    function serializeAttribute(key, value) {
      return `${key}="${value}"`
    }
  }

  /**
   * Converts this node to a JSON structure suitable for serialization.
   * @param {?(Object)} opts
   * @param {?(Boolean)} [opts.normalize = false] - Normalize tag and attributes names
   * @param {?(Boolean)} [opts.children = true] - Include children in the result
   * @param {?(Boolean)} [opts.attributes = true] - Include attributes in the result
   * @return {Object}
   */
  toJSON(opts) {
    opts = { ...opts }

    if (opts.normalize) {
      var { name, attributes } = this
    } else {
      var { originalName: name, originalAttributes: attributes } = this
    }

    const { children, body } = this
    const output = { name, body }

    if (false !== opts.attributes) {
      output.attributes = attributes
    } else {
      output.attributes = {}
    }

    if (false !== opts.children) {
      output.children = children.map(visit)
    } else {
      output.children = []
    }

    return output

    function visit(node) {
      if (!node) { return null }
      if ('function' === typeof node.toJSON) {
        return node.toJSON(opts)
      } else {
        return node
      }
    }
  }

  /**
   * Implements `util.inspect.custom` symbol for pretty output.
   * @protected
   * @return {String}
   */
  [inspect.custom]() {
    return this.toString()
  }
}

/**
 * A simple stack to store parser state.
 * @public
 * @class ParserState
 */
class ParserState {

  /**
   * `ParserState` class constructor.
   * @param {?(Array)} stack
   */
  constructor(stack) {
    this.stack = stack || []
  }

  get head() {
    return this.stack[0] || null
  }

  get tail() {
    const index = Math.max(0, this.stack.length - 1)
    return this.stack[index] || null
  }

  get length() {
    return this.stack.length
  }

  get depth() {
    return this.length
  }

  push(...items) {
    return this.stack.push(...items)
  }

  pop() {
    return this.stack.pop()
  }
}

/**
 * Callback handlers for a `Parser` instance.
 * @public
 * @class ParserHandler
 */
class ParserHandler {
  get rootNode() {
    return this.parser.state.head
  }

  get currentNode() {
    return this.parser.state.tail
  }

  onparserinit(parser) {
    debug('ParserHandler::onparserinit')
    this.parser = parser
  }

  onreset() {
    debug('ParserHandler::onreset')
  }

  onend() {
    debug('ParserHandler::onend')

    this.parser.onend()
  }

  onerror(err) {
    debug('ParserHandler::onerror %s', err && err.message)

    this.parser.onerror(err)
  }

  onopentag(name, attributes) {
    debug('ParserHandler::onopentag %s', name)

    const { currentNode } = this
    const node = new ParserNode(name, attributes, this.parser.state.depth)

    this.parser.state.push(node)

    if (currentNode) {
      currentNode.appendChild(node)
    }
  }

  onopentagname(name) {
    debug('ParserHandler::onopentagname %s', name)
  }

  onclosetag(name) {
    debug('ParserHandler::onclosetag %s', name)
    if (this.parser.state.length > 1) {
      this.parser.state.pop()
    }
  }

  onattribute(name, value, quote = null) {
    debug(`ParserHandler::onattribute %s=${quote || ''}%s${quote || ''}`, name, value)
  }

  ontext(data) {
    debug('ParserHandler::ontext %s', data)

    const { currentNode } = this

    if (currentNode && data) {
      currentNode.body = data
    }
  }

  oncomment(data) {
    debug('ParserHandler::oncomment %s', data)

    const { currentNode } = this

    if (currentNode) {
      currentNode.comments.push(data)
    }
  }

  oncdatastart() {
    debug('ParserHandler::oncdatastart')
  }

  oncdataend() {
    debug('ParserHandler::oncdataend')
  }

  oncommentend() {
    debug('ParserHandler::oncommentend')
  }

  onprocessinginstruction(name, data) {
    debug('ParserHandler::onprocessinginstruction', name, data)
  }
}

/**
 * Options with defaults for a `ParserHandler` instance
 * @public
 * @class ParserOptions
 */
class ParserOptions {
  /**
   * Creates a new `ParserOptions` instance if one is not given
   * @param {?(Object)} opts
   */
  static from(opts) {
    if (opts instanceof this) {
      return opts
    }

    return new this(opts)
  }

  /**
   * `ParserOptions` class constructor.
   * @param {?(Object)} opts
   */
  constructor(opts) {
    opts = { ...opts }

    // parser runtime
    this.handler = opts.handler || new ParserHandler()

    // htmlparser2 settings
    this.xmlMode = true
    this.lowerCaseTags = false
    this.decodeEntities = true
    this.recognizeCDATA = true
    this.recognizeSelfClosing = true
    this.lowerCaseAttributeNames = false

    Object.assign(this, opts)
  }
}

/**
 * An ADI3 XML parser for SCTE 236
 * @public
 * @class Parser
 * @extends htmlparser2.Parser
 * @see {@link https://github.com/fb55/htmlparser2}
 * @see {@link https://scte-cms-resource-storage.s3.amazonaws.com/ANSI_SCTE-35-2019a-1582645390859.pdf}
 */
class Parser extends htmlparser2.Parser {

  /**
   * Creates a `WritableStream` for a new `Parser` instance.
   * @param {?(ParserOptions)} opts
   * @return {WritableStream}
   */
  static createWriteStream(opts) {
    const parser = new this(opts)
    return parser.createWriteStream()
  }

  /**
   * `Parser` class constructor.
   * @constructor
   * @param {?(ParserOptions)} opts
   */
  constructor(opts) {
    const { handler, ...parserOptions } = ParserOptions.from(opts)

    super(handler, parserOptions)

    this.promise = makePromise()
    this.handler = handler
    this.state = new ParserState()
    this.ended = false
    this.error = null
  }

  /**
   * A pointer to the parsed state nodes
   * @accessor
   * @type {Array}
   */
  get nodes() {
    return this.state.stack
  }

  /**
   * A pointer to the root node on the parsed state stack.
   * @accessor
   * @type {ParserNode}
   */
  get rootNode() {
    return this.nodes[0] || null
  }

  /**
   * Creates a `WritableStream` for the `Parser` instance.
   * @return {WritableStream}
   */
  createWriteStream(...args) {
    const stream = new WritableStream(...args)
    stream._parser = this
    Object.defineProperty(stream, 'parser', { get: () => stream._parser })
    this.catch((err) => stream.emit('error', err))
    return stream
  }

  onend() {
    this.ended = true
    this.promise.resolve()
  }

  onerror(err) {
    this.error = err
    this.promise.reject(err)
  }

  /**
   * Implements `then` for async/await and `Promise` compat.
   * @return {Promise}
   */
  then(resolve, reject) {
    return this.promise.then(resolve, reject)
  }

  /**
   * Implements `catch` for async/await and `Promise` compat.
   * @return {Promise}
   */
  catch(reject) {
    return this.promise.catch(reject)
  }

  /**
   * Query the parsed document object model using "JSONata" query syntax.
   * @param {?(String)} [query = '$'] - A "JSONata" query string
   * @param {?(Object)} opts - Query options
   * @param {?(Boolean)} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
   * @return {Array|Object|null}
   * @see {@link https://jsonata.org}
   */
  query(query, opts) {
    if (!this.rootNode) {
      return null
    }

    query = query || '$' // reference to root node
    opts = { ...opts }

    const expression = cache.get(query) || jsonata(query)
    const model = {}

    cache.set(query, expression)

    visit(model, this.rootNode)

    const result = expression.evaluate(model)

    if (result) {
      delete result.sequence
    }

    if (Array.isArray(result) && 'function' !== typeof result.toJSON) {
      return Object.defineProperty(result, 'toJSON', {
        enumerable: false,
        value: (...args) => {
          return result.map((r) => 'function' === typeof r.toJSON ? r.toJSON(...args) : r)
        }
      })
    }

    return result || null

    function visit(target, node) {
      const { attributes } = node
      const children = node.children.map((child) => visit({}, child))

      if (!target[node.name]) {
        const object = Object.assign({}, attributes)

        Object.defineProperty(object, 'attributes', {
          configurable: true,
          enumerable: false,
          get: () => attributes
        })

        Object.defineProperty(object, 'children', {
          configurable: false,
          enumerable: true,
          value: children
        })

        Object.defineProperty(object, 'toJSON', {
          configurable: true,
          enumerable: false,
          value: (...args) => node.toJSON(...args)
        })

        if (opts.inspect) {
          object[inspect.custom] = (...args) => {
            return node[inspect.custom](...args)
          }
        }

        target[node.name] = makeProxy(object)
        if (opts.inspect) {
          target[inspect.custom] = object[inspect.custom]
        }
      }

      return target
    }
  }
}

/**
 * Factory for hybrid proxied objects supporting both arrays and objects
 * @private
 * @param {Array|Object}
 * @return {Proxy}
 */
function makeProxy(object) {
  return new Proxy(object, {
    enumerate() {
      return object.length ? object : Object.keys(object)
    },

    ownKeys() {
      const keys = Object.keys(object)

      if (object.length && !keys.includes('length')) {
        keys.push('length')
      }

      return keys
    },

    set(_, key, value) {
      object[key] = value
    },

    get(_, key, reciever) {
      if (Array.isArray(object)) {
        if ('sequence' === key || 'cons' === key) {
          return true
        }
      }

      return object[key]
    }
  })
}

/**
 * Makes a promise for deferred resolution with `resolve` and `reject`
 * attached to the returned promise.
 * @private
 * @return {Promise}
 */
function makePromise() {
  const p = {}
  const promise = new Promise((resolve, reject) => Object.assign(p, { resolve, reject }))
  return Object.assign(promise, p)
}

/**
 * Module exports.
 */
module.exports = {
  ParserHandler,
  ParserOptions,
  ParserState,
  ParserNode,
  Parser
}
