const { WritableStream } = require('htmlparser2/lib/WritableStream')
const htmlparser2 = require('htmlparser2')
const { inspect } = require('util')
const { query } = require('./query')
const camelcase = require('camelcase')
const defined = require('defined')
const assert = require('nanoassert')
const debug = require('debug')('mediaxml')

const {
  normalizeAttributeValue,
  normalizeAttributeKey,
  normalizeAttributes,
  normalizeValue
} = require('./normalize')

/**
 * A special name for a _fragment node_ which is a collection of
 * nodes without an explicit parent node.
 * @memberof parser
 * @const
 * @type {String}
 */
const FRAGMENT_NODE_NAME = '#fragment'

/**
 * A special name for a _text node_ which is container for a body of
 * string text.
 * @memberof parser
 * @const
 * @type {String}
 */
const TEXT_NODE_NAME = '#text'

/**
 * A simple container for a `ParserNode` instance attributes.
 * @class ParserNodeAttributes
 * @memberof parser
 */
class ParserNodeAttributes {

  /**
   * `ParserNodeAttributes` class constructor.
   * @private
   * @param {?Object} attributes
   * @param {?Object} opts
   */
  constructor(attributes, opts) {
    if (attributes && 'object' === typeof attributes) {
      for (const key in attributes) {
        this.set(key, attributes[key])
      }
    }

    Object.defineProperty(this, 'options', {
      configurable: false,
      enumerable: false,
      value: opts || {}
    })

    this.toJSON = null
    Object.defineProperty(this, 'toJSON', {
      configurable: false,
      enumerable: false,
      value(opts) {
        if (true === opts) {
          opts = { normalize: true }
        } else {
          opts = { ...opts }
        }

        if (!opts.normalize) {
          return { ...this }
        }

        return normalizeAttributes({ ...this }, {
          preserveConsecutiveUppercase: false,
          normalizeValues: true,
          ...opts
        })
      }
    })
  }

  /**
   * Get an attribute value by name.
   * @param {String} name
   * @return {?Mixed}
   */
  get(name) {
    return defined(this[normalizeAttributeKey(name, this.options)], null)
  }

  /**
   * Set an attribute value by name.
   * @param {String} name
   * @param {?Mixed} value
   */
  set(key, value) {
    if (key && 'object' === typeof key) {
      for (const k in key) {
        this.set(k, key[k])
      }
    } else {
      const normalizedKey = normalizeAttributeKey(key, this.options)
      value = normalizeAttributeValue(value, this.options)
      if (key !== normalizedKey) {
        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: false,
          set: (val) => { value = normalizeAttributeValue(val, this.options) },
          get: () => value
        })
      }

      Object.defineProperty(this, normalizedKey, {
        configurable: true,
        enumerable: true,
        set: (val) => { value = normalizeAttributeValue(val, this.options) },
        get: () => value
      })
    }
  }

  /**
   * Computed keys for this attributes object.
   * @return {Array<String>}
   */
  keys() {
    return Object.keys(this)
  }

  /**
   * Computed values for this attributes object.
   * @return {Array<String>}
   */
  values() {
    return Object.values(this)
  }

  /**
   * Implements `Symbol.iterator` symbol for converting this to an
   * iterable object of key-value pairs
   * @private
   * @return {Iterator}
   */
  *[Symbol.iterator]() {
    const keys = this.keys()
    const values = this.values()
    for (let i = 0; i < keys.length; ++i) {
      yield [keys[i], values[i]]
    }
  }

  /**
   * Implements `util.inspect.custom` symbol for pretty output.
   * @private
   * @return {String}
   */
  [inspect.custom]() {
    const attributes = this.toJSON({ normalize: true, normalizeValues: true })
    const { name } = this.constructor
    return `${name} ${inspect(attributes, { colors: true })}`
  }

  /**
   * Converts attributes to a JSON object.
   * @type {Function}
   * @param {?Object|Boolean} opts - JSON output configuration. Set to `true` to just normalize.
   * @param {?Object} [opts.normalize = false] - Normalize JSON output
   * @param {?Object} [opts.normalizeValues = false] - Normalize JSON output values
   * @return {Object}
   */
  toJSON() {
    return { ...this }
  }
}

/**
 * A container for a text found in the body of `ParserNode` instances
 * @class ParserNodeText
 * @extends String
 * @memberof parser
 */
class ParserNodeText extends String {

  /**
   * Create a new `ParserNodeText` from input. Input is coalesced to a
   * string type.
   * @static
   * @param {?Mixed} input
   * @return {ParserNodeText}
   */
  static from(input) {
    return new this(String(defined(input, '')))
  }

  /**
   * `ParserNodeText` class constructor.
   * @private
   * @param {String} text
   */
  constructor(text) {
    super(text || '')

    Object.defineProperty(this, 'text', {
      enumerable: false,
      configurable: false,
      get: () => text || ''
    })

    const descriptors = Object.getOwnPropertyDescriptors(String.prototype)
    for (const key in descriptors) {
      const descriptor = descriptors[key]
      const { value } = descriptor
      if (['toString', 'valueOf'].includes(key)) {
        Object.defineProperty(this, key, descriptor)
      } else if ('function' === typeof value) {
        descriptor.value = (...args) => {
          const result = this.text[key](...args)

          if (Array.isArray(result)) {
            return result.map((r) => ParserNodeText.from(r))
          }

          return ParserNodeText.from(result)
        }

        if (descriptor.configurable) {
          Object.defineProperty(this, key, descriptor)
        }
      }
    }
  }

  /**
   * The name of this text node.
   * @type {String}
   */
  set name(value) { void value }
  get name() { return TEXT_NODE_NAME }

  /**
   * The text content of this text node.
   * @type {String}
   */
  set text(value) { void value }
  get text() { return '' }

  /**
   * `true` to indicate this node is a text node.
   * @accessor
   * @type {Boolean}
   */
  get isText() {
    return true
  }

  /**
   * Computed string of this text node.
   * @protected
   * @return {String}
   */
  toString() {
    return this.text
  }

  /**
   * Computed value of this text node.
   * @protected
   * @return {String}
   */
  valueOf() {
    return this.toString()
  }

  /**
   * Converts this text node to a string for JSON
   * output
   * @return {String}
   */
  toJSON() {
    return this.toString()
  }

  /**
   * Implements `util.inspect.custom` symbol for pretty output.
   * @private
   * @return {String}
   */
  [inspect.custom]() {
    return inspect(this.text, { colors: true })
  }

  /**
   * Implements `Symbol.iterator` symbol for converting this text node
   * to an iterable string.
   * @private
   * @return {Iterator}
   */
  *[Symbol.iterator]() {
    for (let i = 0; i < this.text.length; ++i) {
      yield this.text[i]
    }
  }
}

/**
 * A container for a collection of `ParserNode` instances not represented by a root
 * `ParserNode` instance.
 * @class ParserNodeFragment
 * @extends Array
 * @memberof parser
 */
class ParserNodeFragment extends Array {

  /**
   * Create a `ParserNodeFragment` from input.
   * @static
   * @param {Mixed} input
   * @return {ParserNodeFragment}
   */
  static from(input, ...args) {
    if (Array.isArray(input)) {
      return new this(null, { children: input })
    } else if (input instanceof this) {
      return new this(input.node.originalAttributes, input.node.options)
    } else {
      return new this(input, ...args)
    }
  }

  /**
   * `ParserNodeFragment` class constructor.
   * @private
   * @param {?Object} attributes
   * @param {?Object} opts
   */
  constructor(attributes, opts) {
    if (!opts) {
      opts = {}
    }

    const children = Array.isArray(opts.children) ? opts.children.filter(Boolean) : []
    super(children.length)

    for (let i = 0; i < children.length; ++i) {
      Object.defineProperty(this, i, {
        configurable: false,
        enumerable: false,
        value: children[i]
      })
    }

    const node = opts.node || ParserNode.from(FRAGMENT_NODE_NAME, attributes, opts)
    Object.defineProperty(this, 'node', {
      configurable: false,
      enumerable: false,
      get: () => node
    })

    Object.freeze(this)
  }

  /**
   * The `ParserNode` instance this fragment wraps.
   * @type {ParserNode}
   */
  set node(value) { void value }
  get node() { return null }

  /**
   * `true` if this node is connected to a parent node.
   * @accessor
   * @type {Boolean}
   */
  get isConnected() {
    return false
  }

  /**
   * `true` if this node is not connected to a parent node and is not a root node.
   * @accessor
   * @type {Boolean}
   */
  get isOrphaned() {
    return !this.isConnected && 0 === this.children.length
  }

  /**
   * Will always be `true` because it is a fragment.
   * @accessor
   * @type {Boolean}
   */
  get isFragment() {
    return true
  }

  /**
   * A reference to the children in the underlying `ParserNode` for
   * this fragment.
   * @accessor
   * @type {Array}
   */
  get children() {
    return this.node.children
  }

  /**
   * Always `null` as a fragment cannot have a parent.
   * @type {?ParserNode}
   */
  get parent() {
    return null
  }

  /**
   * Query the nodes this fragment represents.
   * @param {String} queryString
   * @param {?Object} opts
   * @return {ParserNode|ParserNodeFragment|ParserNodeText}
   */
  query(queryString, opts) {
    return this.node.query(queryString, {
      model: this.children,
      ...opts,
    })
  }

  /**
   * Converts this fragment to a string.
   * @return {String}
   */
  toString(...args) {
    return this.node.toString(...args)
  }

  /**
   * Converts this fragment to a JSON object.
   * @return {Array}
   */
  toJSON(...args) {
    return this.children
  }
}

/**
 * A container for a parsed XML node with references to
 * its parent node and children.
 * @class ParserNode
 * @memberof parser
 * @example
 * const metadata = ParserNode.from('Metadata')
 * const appData = ParserNode.from('App_Data', { app: 'SVOD', name: 'Type', value: 'title' })
 * metadata.appendChild(appData)
 *
 * console.log(metadata)
 * // <Metadata>
 * //   <App_Data app="SVOD" name="Type" value="title" />
 * // </Metadata>
 */
class ParserNode {

  /**
   * A reference to the `Fragment` class for a `ParserNode` instance.
   * @static
   * @accessor
   * @type {ParserNodeFragment}
   */
  static get Fragment() {
    return ParserNodeFragment
  }

  /**
   * A reference to the `Text` class for a `ParserNode` instance.
   * @static
   * @accessor
   * @type {ParserNodeText}
   */
  static get Text() {
    return ParserNodeText
  }

  /**
   * Predicate function to help determine if input is a valid `ParserNode` instance.
   * @static
   * @param {Mixed} input
   * @return {Boolean}
   */
  static isParserNode(input) {
    return (
      input instanceof this ||
      input instanceof this.Text ||
      input instanceof this.Fragment
    )
  }

  /**
   * Creates a fragment parser node.
   * @static
   * @see {ParserNode#from}
   * @param {?Object} attributes
   * @param {?Object} opts
   * @return {ParserNodeFragment}
   */
  static createFragment(attributes, opts) {
    return new ParserNodeFragment(attributes, opts)
  }

  /**
   * Creates a fragment parser node.
   * @static
   * @see {ParserNodeText#from}
   * @param {?String} text
   * @return {ParserNodeText}
   */
  static createText(text) {
    return ParserNodeText.from(text)
  }

  /**
   * Creates a new `ParserNode` from input.
   * @static
   * @param {String|ParserNode|Object} nameOrNode
   * @param {?Object} attributes
   * @param {?Object} opts
   * @return {?ParserNode}
   * @example
   * const node = ParserNode.from('App_Data', { app: 'SVOD', name: 'Type', value: 'title' })
   * console.log(node)
   * // <App_Data app="SVOD" name="Type" value="title" />
   */
  static from (nameOrNode, attributes, opts) {
    if (this.isParserNode(nameOrNode)) {
      opts = attributes
      const { originalName, originalAttributes, depth, options } = nameOrNode
      return new this(originalName, originalAttributes, depth, { ...options, ...opts })
    }

    if ('string' === typeof nameOrNode) {
      return new this(nameOrNode, attributes, 0, opts)
    }

    if (nameOrNode && 'object' === typeof nameOrNode) {
      const { originalName, originalAttributes } = nameOrNode
      const { name, attributes, depth } = nameOrNode
      const { options, ...rest } = nameOrNode
      return new this(
        originalName || name,
        originalAttributes || attributes,
        { ...options, ...rest })
    }

    return null
  }

  /**
   * `ParserNode` class constructor.
   * @private
   * @param {String} name
   * @param {?Object} attributes
   * @param {?Number} depth
   * @param {?Object} opts
   */
  constructor(name, attributes, depth, opts) {
    const originalAttributes = attributes
    let originalName = name || ''
    name = normalizeName(name)

    Object.defineProperty(this, 'originalName', {
      configurable: false,
      enumerable: false,
      get: () => originalName,
      set: (value) => { this.name = value }
    })

    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      get: () => name,
      set: (value) => {
        originalName = value
        name = normalizeName(value)
      }
    })

    let body = new ParserNodeText(opts && opts.body ? opts.body : null, opts)
    Object.defineProperty(this, 'body', {
      configurable: true,
      enumerable: true,
      get: () => body,
      set: (value) => { body = new ParserNodeText(value || null, opts) }
    })

    Object.defineProperty(this, 'depth', {
      configurable: true,
      enumerable: false,
      set: (value) => { depth = value },
      get: () => depth || 0
    })

    let parent = opts && opts.parent ? opts.parent : null
    Object.defineProperty(this, 'parent', {
      configurable: true,
      enumerable: false,
      get: () => parent,
      set: (value) => { parent = value }
    })

    Object.defineProperty(this, 'options', {
      configurable: false,
      enumerable: false,
      get: () => opts || null
    })

    const children = (
      Array.from(Array.isArray(opts && opts.children) ? opts.children : [])
      .map((child) => child && child._data ? child._data : child)
    )

    Object.defineProperty(this, 'children', {
      configurable: false,
      enumerable: true,
      get: () => children
    })

    const comments = Array.isArray(opts && opts.comments) ? opts.comments : []
    Object.defineProperty(this, 'comments', {
      configurable: false,
      enumerable: false,
      get: () => comments
    })

    attributes = new ParserNodeAttributes(originalAttributes, opts)
    Object.defineProperty(this, 'attributes', {
      configurable: false,
      enumerable: false,
      get: () => attributes
    })

    Object.defineProperty(this, 'originalAttributes', {
      configurable: false,
      enumerable: false,
      get: () => originalAttributes || {}
    })

    function normalizeName(name) {
      return name ? name.toLowerCase() : ''
    }
  }

  /**
   * The original name of this node.
   * @type {String}
   */
  set originalName(value) {  }
  get originalName() { return '' }

  /**
   * The normalized name of this node in camelcase.
   * @type {String}
   */
  set name(value) {  }
  get name() { return '' }

  /**
   * The text contents of this node, if available.
   * @type {ParserNodeText}
   */
  set body(value) {  }
  get body() { return '' }

  /**
   * The depth this node appears in the tree.
   * @type {Number}
   */
  set depth(value) {  }
  get depth() { return 0 }

  /**
   * A reference to the parent node of this node.
   * @type {?ParserNode}
   */
  set parent(value) {  }
  get parent() { return null }

  /**
   * A reference to the options used when this instance was created
   * @type {?Object}
   */
  set options(value) {  }
  get options() { return 0 }

  /**
   * A reference to the child nodes in this node.
   * @type {Array<ParserNode>}
   */
  set children(value) {  }
  get children() { return null }

  /**
   * A reference to the comment nodes in this node.
   * @type {Array<ParserNode>}
   */
  set comments(value) {  }
  get comments() { return null }

  /**
   * A key-value mapping of normalized attributes in this node.
   * @type {Object}
   */
  set attributes(value) {  }
  get attributes() { return null }

  /**
   * The original attributes, before normalization.
   * @property
   * @type {?Object}
   */
  set originalAttributes(value) {  }
  get originalAttributes() { return null }

  /**
   * `true` if this node is connected to a parent node.
   * @accessor
   * @type {Boolean}
   */
  get isConnected() {
    return Boolean(this.parent)
  }

  /**
   * `true` if this node is not connected to a parent node and is not a root node.
   * @accessor
   * @type {Boolean}
   */
  get isOrphaned() {
    return !this.isConnected && 0 === this.children.length
  }

  /**
   * `true` to indicate that this is a node.
   * @accessor
   * @type {Boolean}
   */
  get isParserNode() {
    return true
  }

  /**
   * Computed index this node exists in its parent tree.
   * @accessor
   * @type {Number}
   */
  get index() {
    if (this.parent) {
      return this.parent.children.indexOf(this)
    }

    return -1
  }

  /**
   * Computed number of child nodes in this node.
   * @accessor
   * @type {Number}
   */
  get length() {
    return this.children.length
  }

  /**
   * Called when connected to a new parent node.
   * @param {ParserNode} parent
   * @param {ParserNode} node
   */
  onconnect(parent, node) {
    void parent, node
  }

  /**
   * Called when disconnected from a parent node.
   * @param {ParserNode} parent
   * @param {ParserNode} node
   */
  ondisconnect(parent, node) {
    void parent, node
  }

  /**
   * Checks if node is contained within this one.
   * @param {ParserNode} node
   * @return {Boolean}
   */
  includes(node) {
    return node && node.parent === this && node.children.includes(node)
  }

  /**
   * Append one or more nodes to this node.
   * @param {ParserNode} ...nodes
   * @return {ParserNode}
   * @throws TypeError
   * @example
   * const ams = ParserNode.from('AMS', amsAttributes)
   * const metadata = ParserNode.from('Metadata')
   * const appData = [
   *   ParserNode.from('App_Data', { App: 'SVOD', Name: 'Metadata_Spec_Version', Value: 'CableLabsVOD1.1', }),
   *   ParserNode.from('App_Data', { App: 'SVOD', Name: 'Provider_Content_Tier', Value: 'HD_UNIFIED', })
   * ]
   *
   * metadata.append(ams, appData)
   */
  append(...nodes) {
    nodes = nodes.flatMap(flatMap)

    for (const node of nodes) {
      this.appendChild(node)
    }

    return this

    function flatMap(node) {
      if (Array.isArray(node)) {
        return node.flatMap(flatMap)
      } else {
        return node
      }
    }
  }

  /**
   * Remove one or more nodes to this node.
   * @param {ParserNode} ...nodes
   * @return {ParserNode}
   * @throws TypeError
   * @throws Error
   */
  remove(...nodes) {
    for (const node of nodes) {
      this.removeChild(node)
    }

    return this
  }

  /**
   * Appends a child node to this node.
   * @param {ParserNode} node
   * @return {ParserNode}
   * @throws TypeError
   */
  appendChild(node) {
    if (!node || !this.constructor.isParserNode(node)) {
      throw new TypeError(
        'Invalid input node for appendChild: ' +
        'The node to be appened is not an instance of \'ParserNode\'.')
    }

    if (this === node.parent || this.children.includes(node)) {
      return node
    }

    if (node.parent && 'function' === typeof node.parent.removeChild) {
      node.parent.removeChild(node)
    }

    node.parent = this
    this.children.push(node)

    if ('function' === typeof node.onconnect) {
      node.onconnect(this, node)
    }
  }

  /**
   * Removes a child node to this node.
   * @param {ParserNode} node
   * @throws Error
   * @throws TypeError
   */
  removeChild(node) {
    if (!node || !this.constructor.isParserNode(node)) {
      throw new TypeError(
        'Invalid input node for removeChild: ' +
        'The node to be removed is not an instance of \'ParserNode\'.')
    }

    if (this !== node.parent || this.children.includes(node)) {
      throw new Error(
        'Invalid input node for removeChild: ' +
        'The node to be removed is not a child of this node.')
    }

    const index = this.children.indexOf(node)
    if (-1 !== index) {
      node.parent = null
      this.children.splice(index, 1)
      if ('function' === typeof node.onconnect) {
        node.ondisconnect(this, node)
      }
    }
  }

  /**
   * Clone node, optionally cloning all children.
   * @param {?Boolean} [deep = false] - Clone children
   * @return {ParserNode}
   */
  clone(deep, ...args) {
    const cloned = this.constructor.from(this, ...args)
    if (true === deep) {
      for (const child of this.children) {
        cloned.children.push(child.clone(true))
      }
    }

    return cloned
  }

  /**
   * An alias to `clone()`.
   * @return {ParserNode}
   */
  cloneNode(...args) {
    return this.clone(...args)
  }

  /**
   * Query the document object model represented by this node
   * using "JSONata" query syntax.
   * @param {?String} [queryString = '$'] - A "JSONata" query string
   * @param {?Object} opts - Query options
   * @param {?Boolean} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
   * @return {Array|Object|null}
   * @see {@link https://jsonata.org}
   * @example
   */
  query(queryString, opts) {
    return query(this, queryString, opts)
  }

  /**
   * Converts this node ands children to a XML string
   * representing this node and its children.
   * @param {?Object} opts
   * @param {?Boolean} [opts.attributes = true] - Include attributes in the result
   * @param {?Boolean} [opts.normalize = false] - Normalize tag and attributes names
   * @param {?Boolean} [opts.children = true] - Include children in the result
   * @param {?Boolean} [opts.body = true] - Include node body in the result
   * @param {?Number} [opts.depth = 0] - The starting depth of this node
   * @return {String}
   */
  toString(opts) {
    if (true === opts) {
      opts = {
        normalize: true
      }
    } else {
      opts = { ...opts }
    }

    let { originalName: name, originalAttributes: attributes } = this

    // use normalized values if requested
    if (opts.normalize) {
      name = this.name
      attributes = this.attributes
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

    if ((!body || !body.length || false === opts.body) && (!children.length || false === opts.children)) {
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
        .map((child) => {
          return child.toString({ ...opts, depth: depth + 1 })
        })
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
   * @param {?Object} opts
   * @param {?Boolean} [opts.normalize = false] - Normalize tag and attributes names
   * @param {?Boolean} [opts.children = true] - Include children in the result
   * @param {?Boolean} [opts.attributes = true] - Include attributes in the result
   * @return {Object}
   */
  toJSON(opts) {
    if (true === opts) {
      opts = { normalize: true }
    } else {
      opts = { ...opts }
    }

    let { originalName: name, originalAttributes: attributes } = this

    // use normalized values if requested
    if (opts.normalize) {
      name = this.name
      attributes = this.attributes.toJSON(true)
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
   * @private
   * @return {String}
   */
  [inspect.custom]() {
    return this.toString()
  }

  /**
   * Implements `Symbol.iterator` symbol for converting this node
   * to an iterable
   * @private
   * @return {Iterator}
   */
  *[Symbol.iterator]() {
    for (let i = 0; i < this.length; ++i) {
      yield this.children[i]
    }
  }

  /**
   * Implements a simple `slice` function to slice a selection of children
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNodeFragment}
   * @example
   * const nodes = node.slice(0, 2) // first 2 children
   */
  slice(...args) {
    const { constructor, children } = this
    return constructor.createFragment(null, {
      children: children.slice(...args)
    })
  }

  /**
   * Implements a simple `forEach` function over the children in this node
   * @param {Function} fn
   * @param {?Object} thisArg
   * @example
   * const nodes = node.query('.*[name="asset"]')
   * nodes.forEach((node) => { ... })
   */
  forEach(fn, thisArg) {
    const { children, length } = this
    const bound = thisArg || this

    for (let i = 0; i < length; ++i) {
      fn.call(bound, child, i, children)
    }
  }

  /**
   * Implements a simple `map` function to map children to new `ParserNode`
   * fragment instance.
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * const nodes = node.query('.*[name="asset"]')
   * const mapped = nodes.map((node) => node)
   */
  map(fn, thisArg) {
    const { constructor, children } = this
    const parent = this
    const bound = thisArg || this

    return constructor.createFragment(null, {
      children: children.map(map)
    })

    function map(child, ...args) {
      const arg = constructor.isParserNode(child)
        ? child
        : constructor.from(child, { parent })

      return fn.call(bound, arg, ...args)
    }
  }

  /**
   * Implements a simple `flatMap` function to map children to new `ParserNode`
   * fragment instance.
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * const nodes = node.query('.*[name="asset"]')
   * const mapped = nodes.map((node) => node)
   */
  flatMap(fn, thisArg) {
    const { constructor, children } = this
    const parent = this
    const bound = thisArg || this

    return constructor.createFragment(null, {
      children: children.flatMap(flatMap)
    })

    function flatMap(child, ...args) {
      if (Array.isArray(child)) {
        return child.map(flatMap)
      }

      const arg = constructor.isParserNode(child)
        ? child
        : constructor.from(child, { parent })

      return fn.call(bound, arg, ...args)
    }
  }

  /**
   * Implements a simple `filter` function to filter children into a resulting
   * `ParserNode` fragment instance.
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * const nodes = node.query('.*[name="asset"]')
   * const mapped = nodes.filter((node) => node.attributes.app)
   */
  filter(fn, thisArg) {
    const { constructor, children } = this
    const bound = thisArg || this

    return constructor.createFragment(null, {
      children: children.filter(filter)
    })

    function filter() {
      return fn.call(bound, ...args)
    }
  }

  /**
   * Implements a simple `traverse` function to visit every node in this tree.
   * The first call will be to the root (this) node, and all subsequent calls will
   * be to each child node in the tree.
   * @param {Function} fn
   * @param {?Object} thisArg
   */
  traverse(fn, thisArg, skip = false) {
    const { children } = this
    const bound = thisArg || this

    if (true !== skip && false === fn.call(bound, this)) {
      return
    }

    for (const child of children) {
      if (false === fn.call(bound, child)) {
        break
      }

      if ('function' === typeof child.traverse) {
        child.traverse(fn, thisArg, true)
      }
    }
  }
}

/**
 * A simple stack to store parser state.
 * @class ParserState
 * @memberof parser
 */
class ParserState {

  /**
   * `ParserState` class constructor.
   * @param {?Array} stack
   */
  constructor(stack) {
    this.stack = stack || []
  }

  /**
   * The first node in the parser state stack.
   * @accessor
   * @type {?ParserNode}
   */
  get head() {
    return this.stack[0] || null
  }

  /**
   * The last node in the parser state stack.
   * @accessor
   * @type {?ParserNode}
   */
  get tail() {
    const index = Math.max(0, this.stack.length - 1)
    return this.stack[index] || null
  }

  /**
   * The number of nodes in the parser state stack.
   * @accessor
   * @type {Number}
   */
  get length() {
    return this.stack.length
  }

  /**
   * An alias to `state.length`
   * @accessor
   * @type {Number}
   */
  get depth() {
    return this.length
  }

  /**
   * Push one or more nodes on to the state stack.
   * @param {ParserNode} ...nodes
   * @return {ParserState}
   */
  push(...nodes) {
    this.stack.push(...nodes)
    return this
  }

  /**
   * Pop off the tail of the parser state stack and return it.
   * @return {?ParserNode}
   */
  pop() {
    return this.stack.pop() || null
  }
}

/**
 * Callback handlers for a `Parser` instance.
 * @class ParserHandler
 * @memberof parser
 * @see {@link https://github.com/fb55/htmlparser2}
 * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L155}
 */
class ParserHandler {

  /**
   * A reference to the parser state head.
   * @accessor
   * @type {?ParserNode}
   */
  get rootNode() {
    return this.parser.state.head
  }

  /**
   * A reference to the parser state tail.
   * @accessor
   * @type {?ParserNode}
   */
  get currentNode() {
    return this.parser.state.tail
  }

  /**
   * Called when the parser handler is initialized.
   * @protected
   * @param {Parser} parser
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L156}
   */
  onparserinit(parser) {
    debug('ParserHandler::onparserinit')
    this.parser = parser
  }

  /**
   * Called when the parser handler is reset.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L161}
   */
  onreset() {
    debug('ParserHandler::onreset')
  }

  /**
   * Called when the parser is finished parsing.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L166}
   */
  onend() {
    debug('ParserHandler::onend')
    this.parser.onend()
  }

  /**
   * Called when the parser encounters an error.
   * @protected
   * @param {Error} err
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L167}
   */
  onerror(err) {
    debug('ParserHandler::onerror %s', err && err.message)
    this.parser.onerror(err)
  }

  /**
   * Called when the parser encounters an open tag.
   * @protected
   * @param {String} name
   * @param {?Object} attributes
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L181}
   */
  onopentag(name, attributes) {
    debug('ParserHandler::onopentag %s', name)

    const { currentNode } = this
    const node = new ParserNode(name, attributes, this.parser.state.depth, this.parser.options)

    this.parser.state.push(node)

    if (currentNode) {
      currentNode.appendChild(node)
    }
  }

  /**
   * Called when the parser encounters an open tag name.
   * @protected
   * @param {String} name
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L169}
   */
  onopentagname(name) {
    debug('ParserHandler::onopentagname %s', name)
  }

  /**
   * Called when the parser encounters a close tag
   * @protected
   * @param {String} name
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L168}
   */
  onclosetag(name) {
    debug('ParserHandler::onclosetag %s', name)
    if (this.parser.state.length > 1) {
      this.parser.state.pop()
    }
  }

  /**
   * Called when the parser encounters an attribute key-value pair
   * @protected
   * @param {String} name
   * @param {String} value
   * @param {?String} quote
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L176}
   */
  onattribute(name, value, quote = null) {
    debug(`ParserHandler::onattribute %s=${quote || ''}%s${quote || ''}`, name, value)
  }

  /**
   * Called when the parser encounters text.
   * @protected
   * @param {String} text
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L182}
   */
  ontext(text) {
    debug('ParserHandler::ontext %s', text)

    const { currentNode } = this

    if (currentNode && text) {
      const { body } = currentNode
      currentNode.body = ParserNodeText.from((body || '') + text)
    }
  }

  /**
   * Called when the parser encounters a comment.
   * @protected
   * @param {String} data
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L183}
   */
  oncomment(data) {
    debug('ParserHandler::oncomment %s', data)

    const { currentNode } = this

    if (currentNode) {
      const comment = new ParserNode('', null, this.parser.state.depth, this.parser.options)
      comment.body = data
      currentNode.comments.push(comment)
    }
  }

  /**
   * Called when the parser encounters the end of a comment.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L186}
   */
  oncommentend() {
    debug('ParserHandler::oncommentend')
  }

  /**
   * Called when the parser encounters CDATA.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L184}
   */
  oncdatastart() {
    debug('ParserHandler::oncdatastart')

    const { currentNode } = this

    if (currentNode) {
      const cdata = new ParserNode('cdata', null, this.parser.state.depth, this.parser.options)
      currentNode.appendChild(cdata)
    }
  }

  /**
   * Called when the parser encounters the end of CDATA.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L185}
   */
  oncdataend() {
    debug('ParserHandler::oncdataend')

    const { currentNode } = this
    if (currentNode && 'cdata' === currentNode.name && this.parser.state.length > 1) {
      this.parser.state.pop()
    }
  }

  /**
   * Called when the parser encounters a processing instruction.
   * @protected
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L187}
   */
  onprocessinginstruction(name, data) {
    debug('ParserHandler::onprocessinginstruction', name, data)
  }
}

/**
 * Options with defaults for a `ParserHandler` instance
 * @class ParserOptions
 * @memberof parser
 * @see {@link https://github.com/fb55/htmlparser2}
 * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L101}
 */
class ParserOptions {

  /**
   * `ParserOptions` class constructor.
   * @param {?Object} opts
   * @param {?Object} [opts.bindings = null] - JSONata query function bindings
   * @param {?ParserHandler} [opts.handler = null] - Parser runtime handler functions
   * @param {?ParserState} [opts.state = null] - Initial parser state
   * @param {Boolean} [opts.xmlMode = true] - Enable/disable XML mode for internal parser
   * @param {Boolean} [opts.lowerCaseTags = false] - Lowercase parsed tag names
   * @param {Boolean} [opts.decodeEntities = true] - Decode entities in parsed nodes
   * @param {Boolean} [opts.recognizeCDATA = true] - recognize
   */
  constructor(opts) {
    opts = { ...opts }

    // user opts first
    this.set(opts)
    this.set({
      bindings: defined(opts.bindings, {}),
      handler: defined(opts.handler, new ParserHandler()),
      state: defined(opts.state, new ParserState()),
      xmlMode: defined(opts.xmlMode, true),
      lowerCaseTags: defined(opts.lowerCaseTags, false),
      decodeEntities: defined(opts.decodeEntities, true),
      recognizeCDATA: defined(opts.recognizeCDATA, true),
      recognizeSelfClosing: defined(opts.recognizeSelfClosing, true),
      lowerCaseAttributeNames: defined(opts.lowerCaseAttributeNames, false),
      preserveConsecutiveUppercase: defined(opts.preserveConsecutiveUppercase, false)
    })
  }

  /**
   * Set an enumerable option value by key.
   * @param {String} key
   * @param {?Mixed} value
   */
  set(key, value) {
    if (key && 'object' === typeof key) {
      for (const k in key) {
        this.set(k, key[k])
      }
    } else {
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: () => value
      })
    }
  }

  /**
   * Get an enumerable option by key
   * @param {String} key
   * @return {?Mixed}
   */
  get(key) {
    return key in this ? this[key] : null
  }

  /**
   * JSONata query runtime bindings for the parsed node tree.
   * @type {Object}
   * @see {@link https://docs.jsonata.org/embedding-extending#expressionregisterfunctionname-implementation-signature}
   */
  set bindings(value) { void value }
  get bindings() { return null }

  /**
   * Parser runtime handler functions for handling state building.
   * @type {ParserHandler}
   */
  set handler(value) { void value }
  get handler() { return null }

  /**
   * Parser runtime state that can be seeded optionally through `ParserOptions`.
   * @type {ParserState}
   */
  set state(value) { void value }
  get state() { return null }

  /**
   * Enable/disable XML mode for internal parser.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L110}
   */
  set xmlMode(value) { void value }
  get xmlMode() { return null }

  /**
   * Lowercase parsed tag names.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L124}
   */
  set lowerCaseTags(value) { void value }
  get lowerCaseTags() { return null }

  /**
   * Decode entities in parsed nodes.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L117}
   */
  set decodeEntities(value) { void value }
  get decodeEntities() { return null }

  /**
   * Recognize CDATA in parsed nodes.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L139}
   */
  set recognizeCDATA(value) { void value }
  get recognizeCDATA() { return null }

  /**
   * Recognize self closing tags when parsing tags.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L147}
   */
  set recognizeSelfClosing(value) { void value }
  get recognizeSelfClosing() { return null }

  /**
   * Lowercase parsed attribute names.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L131}
   */
  set lowerCaseAttributeNames(value) { void value }
  get lowerCaseAttributeNames() { return null }

  /**
   * Preserve consectutive uppercase when normalizing attributes and node names.
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L131}
   */
  set preserveConsecutiveUppercase(value) { void value }
  get preserveConsecutiveUppercase() { return null }
}

/**
 * An XML parser that creates a document object model.
 * @class Parser
 * @memberof parser
 * @extends htmlparser2.Parser
 * @see {@link https://github.com/fb55/htmlparser2}
 */
class Parser extends htmlparser2.Parser {

  /**
   * Create a new `Parser` from input.
   * @static
   * @param {Object|String|Parser} input
   * @return {Parser}
   */
  static from(input, ...args) {
    if (input instanceof Parser) {
      const parser = new this({
        ...input.options,
        handler: input.handler,
        state: input.state,
      })

      parser.promise = input.promise
      parser.ended = input.ended
      parser.error = input.error

      return parser
    }

    if ('string' === typeof input) {
      const parser = new this(...args)
      parser.write(input)
      parser.end()
      return parser
    }

    return new this(input, ...args)
  }

  /**
   * Creates a `WritableStream` for a new `Parser` instance.
   * @param {?ParserOptions} opts
   * @return {WritableStream}
   */
  static createWriteStream(opts) {
    const parser = new this(opts)
    return parser.createWriteStream()
  }

  /**
   * `Parser` class constructor.
   * @constructor
   * @param {?ParserOptions} opts
   */
  constructor(opts) {
    const { handler, state, ...parserOptions } = new ParserOptions(opts)
    let ended = false
    let error = null

    super(handler, parserOptions)

    this.promise = makePromise()

    Object.defineProperty(this, 'options', {
      configurable: false,
      enumerable: false,
      get: () => parserOptions
    })

    Object.defineProperty(this, 'state', {
      configurable: false,
      enumerable: true,
      get: () => state
    })

    Object.defineProperty(this, 'handler', {
      configurable: false,
      enumerable: true,
      get: () => handler
    })

    Object.defineProperty(this, 'ended', {
      enumerable: true,
      set: (value) => { ended = value },
      get: () => ended
    })

    Object.defineProperty(this, 'error', {
      enumerable: true,
      set: (value) => { error = value },
      get: () => error
    })
  }

  /**
   * A reference to the parser options used to configure this parser instance.
   * @type {ParserOptions}
   */
  set options(value) { void value }
  get options() { return null }

  /**
   * A reference to the parser state maintained by this parser instance.
   * @type {ParserState}
   */
  set state(value) { void value }
  get state() { return null }

  /**
   * A reference to the parser handlers that build the parser state for this instance.
   * @type {ParserHandler}
   */
  set handler(value) { void value }
  get handler() { return null }

  /**
   * A boolean to indicate if the parser has finished parsing its input.
   * @type {Boolean}
   */
  set ended(value) { void value }
  get ended() { return null }

  /**
   * An error, if one occurred during parsing.
   * @type {?Error}
   */
  set error(value) { void value }
  get error() { return null }

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
   * Returns the type of root node associated with this parser.
   * @accessor
   * @type {?String}
   */
  get rootType() {
    const { rootNode } = this

    if (!rootNode) {
      return null
    }

    return rootNode.name
  }

  /**
   * Returns the attributes of the root node associated with this parser.
   * @accessor
   * @type {?Object}
   */
  get rootAttributes() {
    const { rootNode } = this

    if (!rootNode) {
      return null
    }

    return rootNode.attributes || null
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

  /**
   * Called when the parser has finished parser.
   * @private
   */
  onend() {
    this.ended = true
    this.promise.resolve()
  }

  /**
   * Called when the parser has encountered an error.
   * @private
   * @param {Error}
   */
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
   * Query the root document object model using "JSONata" query syntax.
   * @param {?String} [query = '$'] - A "JSONata" query string
   * @param {?Object} opts - Query options
   * @param {?Boolean} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
   * @return {?ParserNode|ParserNodeFragment|ParserNodeText}
   * @see {@link https://jsonata.org}
   */
  query(query, opts) {
    if (!this.rootNode) {
      return null
    }

    return this.rootNode.query(query, opts)
  }
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
 * @module parser
 */
module.exports = {
  FRAGMENT_NODE_NAME,
  TEXT_NODE_NAME,

  ParserNodeAttributes,
  ParserNodeFragment,
  ParserNodeText,
  ParserHandler,
  ParserOptions,
  ParserState,
  ParserNode,
  Parser
}
