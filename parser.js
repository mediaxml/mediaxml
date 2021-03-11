const { WritableStream } = require('htmlparser2/lib/WritableStream')
const InvertedPromise = require('inverted-promise')
const { Readable } = require('streamx')
const { validate } = require('./validate')
const htmlparser2 = require('htmlparser2')
const { inspect } = require('util')
const camelcase = require('camelcase')
const defined = require('defined')
const debug = require('debug')('mediaxml')

const {
  normalizeAttributeValue,
  normalizeAttributeKey,
  normalizeAttributes,
} = require('./normalize')

/**
 * A special name for a _fragment node_ which is a collection of
 * nodes without an explicit parent node.
 * @protected
 * @memberof parser
 * @const
 * @type {String}
 */
const FRAGMENT_NODE_NAME = '#fragment'

/**
 * A special name for a _text node_ which is container for a body of
 * string text.
 * @protected
 * @memberof parser
 * @const
 * @type {String}
 */
const TEXT_NODE_NAME = '#text'

/**
 * A simple container for a `ParserNode` instance attributes.
 * @public
 * @memberof parser
 */
class ParserNodeAttributes {

  /**
   * `ParserNodeAttributes` class constructor.
   * @protected
   * @param {?Object} attributes
   * @param {?Object} opts
   */
  constructor(attributes, opts) {
    Object.defineProperty(this, 'keylist', {
      configurable: false,
      enumerable: false,
      value: new Set()
    })

    Object.defineProperty(this, 'originalKeys', {
      configurable: false,
      enumerable: false,
      value: new Set()
    })

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

    if (attributes && 'object' === typeof attributes) {
      for (const key in attributes) {
        this.set(key, attributes[key])
      }
    }
  }

  /**
   * Clear all known attribute values for all known keys
   */
  clear() {
    for (const key of this.keylist) {
      delete this[key]
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: false
      })
    }

    this.keylist.clear()
    this.originalKeys.clear()
  }

  /**
   * `true` if instance has a value for a given key.
   * @public
   * @param {String} name
   * @return {Boolean}
   */
  has(name) {
    if (!name || 'string' !== typeof name) { return false }
    return name in this || undefined !== this.get(name)
  }

  /**
   * Get an attribute value by name.
   * @public
   * @param {String} name
   * @return {?Mixed}
   */
  get(name) {
    return defined(this[normalizeAttributeKey(name, this.options)], null)
  }

  /**
   * Set an attribute value by name.
   * @public
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

      this.originalKeys.add(key)
      this.keylist.add(key)
      this.keylist.add(normalizedKey)

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
   * @public
   * @return {Array<String>}
   */
  keys() {
    return Array.from(this.originalKeys)
  }

  /**
   * Computed values for this attributes object.
   * @public
   * @return {Array<String>}
   */
  values() {
    return Object.values(this)
  }

  /**
   * Returns an iterable generator for this attributes object.
   * @public
   * @return {Generator}
   */
  iterator() {
    return this[Symbol.iterator]()
  }

  /**
   * Implements `Symbol.iterator` symbol for converting this to an
   * iterable object of key-value pairs
   * @protected
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
    const attributes = this.toJSON({ normalize: false, normalizeValues: true })
    const { name } = this.constructor
    const json = {}
    for (const key of Array.from(this.originalKeys)) {
      const normal = normalizeAttributeKey(key)
      if (normal in attributes) {
        json[key] = attributes[normal]
      }
    }
    return `${name} ${inspect(json, { colors: true })}`
  }

  /**
   * Converts attributes to a JSON object.
   * @public
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
 * A container for a text.
 * @public
 * @memberof parser
 */
class ParserNodeText extends String {

  /**
   * Create a new `ParserNodeText` from input. Input is coalesced to a
   * string type.
   * @public
   * @static
   * @param {?Mixed} input
   * @return {ParserNodeText}
   */
  static from(input, ...args) {
    return new this(String(defined(input, '')), ...args)
  }

  /**
   * `ParserNodeText` class constructor.
   * @private
   * @param {String} text
   */
  constructor(text, opts) {
    text = text || ''
    text = text.trim()

    super(text)

    Object.defineProperty(this, 'text', {
      enumerable: false,
      configurable: false,
      get: () => text
    })

    Object.defineProperty(this, 'depth', {
      enumerable: false,
      configurable: false,
      get: () => depth || 0
    })

    let parent = opts && opts.parent ? opts.parent : null
    Object.defineProperty(this, 'parent', {
      configurable: true,
      enumerable: false,
      get: () => parent,
      set: (value) => { parent = value }
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
   * @public
   * @type {String}
   */
  set name(value) { void value }
  get name() { return TEXT_NODE_NAME }

  /**
   * The text content of this text node.
   * @public
   * @type {String}
   */
  set text(value) { void value }
  get text() { return '' }

  /**
   * `true` to indicate this node is a text node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isText() {
    return true
  }

  /**
   * A reference to the parent node of this text node.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  set parent(value) { void value }
  get parent() { }

  /**
   * Returns an iterable generator for this text node.
   * @public
   * @return {Generator}
   */
  iterator() {
    return this[Symbol.iterator]()
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
   * @public
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
   * @public
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
 * @public
 * @memberof parser
 */
class ParserNodeFragment extends Array {

  /**
   * Create a `ParserNodeFragment` from input.
   * @public
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

    const children = Array.isArray(opts.children) ? [ ...opts.children ].filter(Boolean) : []
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
   * @public
   * @type {ParserNode}
   */
  set node(value) { void value }
  get node() { return null }

  /**
   * `true` if this node is connected to a parent node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isConnected() {
    return false
  }

  /**
   * `true` if this node is not connected to a parent node and is not a root node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isOrphaned() {
    return !this.isConnected && 0 === this.children.length
  }

  /**
   * Will always be `true` because it is a fragment.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isFragment() {
    return true
  }

  /**
   * A reference to the children in the underlying `ParserNode` for
   * this fragment.
   * @public
   * @accessor
   * @type {Array}
   */
  get children() {
    return this.node.children
  }

  /**
   * Always `null` as a fragment cannot have a parent.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get parent() {
    return null
  }

  /**
   * Query the nodes this fragment represents.
   * @public
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
   * @public
   * @return {String}
   */
  toString(...args) {
    return this.node.toString(...args)
  }

  /**
   * Converts this fragment to a JSON object.
   * @public
   * @return {Array}
   */
  toJSON() {
    return this.children
  }
}

/**
 * A container for a parsed XML node with references to
 * its parent node and children.
 * @public
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
   * @public
   * @static
   * @accessor
   * @type {ParserNodeFragment}
   */
  static get Fragment() {
    return ParserNodeFragment
  }

  /**
   * A reference to the `Text` class for a `ParserNode` instance.
   * @public
   * @static
   * @accessor
   * @type {ParserNodeText}
   */
  static get Text() {
    return ParserNodeText
  }

  /**
   * Predicate function to help determine if input is a valid `ParserNode` instance.
   * @public
   * @static
   * @param {Mixed} input
   * @return {Boolean}
   */
  static isParserNode(input) {
    return (
      input instanceof ParserNode ||
      input instanceof this.Fragment ||
      input instanceof this.Text ||
      input instanceof this
    )
  }

  /**
   * Creates a fragment parser node.
   * @public
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
   * @public
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
   * @public
   * @static
   * @param {String|ParserNode|Object} nameOrNode
   * @param {?Object} attributes
   * @param {?Object} opts
   * @return {ParserNode}
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
      const trimmed = nameOrNode.trim()

      if (/^</.test(trimmed) && />$/.test(trimmed)) {
        const tmp = new this()
        tmp.innerXML = nameOrNode
        if (tmp.children && tmp.children.length) {
          return tmp.children[0]
        }
      }

      return new this(nameOrNode, attributes, 0, opts)
    }

    if (nameOrNode && 'object' === typeof nameOrNode) {
      const { originalName, originalAttributes } = nameOrNode
      const { name, attributes } = nameOrNode
      let { options, children, ...rest } = nameOrNode

      if (Array.isArray(children)) {
        children = children.map((child) => {
          if (child instanceof ParserNode) {
            return child
          } else if ('string' === typeof child && !/^</.test(child.trim()) && !/>$/.test(child.trim())) {
            return ParserNodeText.from(child)
          } else {
            return this.from(child)
          }
        })
      }

      return new this(
        originalName || name,
        originalAttributes || attributes,
        0,
        { ...options, ...rest, children })
    }

    return new this(nameOrNode, attributes, 0, opts)
  }

  /**
   * Create an empty `ParserNode` instance.
   * @public
   * @static
   * @return {ParserNode}
   */
  static empty() {
    return this.from()
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
    Object.defineProperty(children, 'toJSON', {
      configurable: false,
      enumerable: false,
      get: () => children.map((child) => child.toJSON())
    })

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
      if ('string' === typeof name) {
        //return name.split(/[_|-]/).map((n) => n.)
        return name.replace(/([a-z|A-Z|0-9])([_|-|:])/i, (str, $1, $2) => {
          return camelcase($1) + $2
        })
      }
    }
  }

  /**
   * The inner XML representation of this node.
   * Setting the inner XML of this node will update body and children
   * of this node instance. If a string is given,
   * it is parsed and the body and children of this node will
   * be updated. If a `ParserNode` instance is given, or an array of
   * them, the children will be updated to include those nodes.
   * @public
   * @accessor
   * @type {String}
   * @example
   * const node = ParserNode.from('rss', {
   *  'xmlns:atom': 'http://www.w3.org/2005/Atom',
   *  'xmlns:media': http://search.yahoo.com/mrss/',
   *  'version': '2.0'
   * })
   *
   * node.innerXML = `
   *   <channel>
   *     <title>Calm Meditation</title>
   *     <link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
   *     <language>en-us</language>
   *     <pubDate>Mon, 02 Apr 2018 16:19:56 -0700</pubDate>
   *     <lastBuildDate>Mon, 02 Apr 2018 16:19:56 -0700</lastBuildDate>
   *     <managingEditor>tomjoht@gmail.com (Tom Johnson)</managingEditor>
   *     <description>Contains short videos capturing still scenes from nature with a music background, intended for calming or meditation purposes. When you're stressed out or upset, watch a few videos. As your mind focuses on the small details, let your worries and frustrations float away. The purpose is not to entertain or to distract, but to help calm, soothe, and surface your inner quiet. The videos contain scenes from the San Tomas Aquinas trail in Santa Clara, California.</description>
   *   </channel>
   * `
   *
   * console.log(node)
   * // <rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
   * //  <channel>
   * //    <title>Calm Meditation</title>
   * //    <link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
   * //    <language>en-us</language>
   * //    <pubDate>Mon, 02 Apr 2018 16:19:56 -0700</pubDate>
   * //    <lastBuildDate>Mon, 02 Apr 2018 16:19:56 -0700</lastBuildDate>
   * //    <managingEditor>tomjoht@gmail.com (Tom Johnson)</managingEditor>
   * //    <description>Contains short videos capturing still scenes from nature with a music background, intended for calming or meditation purposes. When you're stressed out or upset, watch a few videos. As your mind focuses on the small details, let your worries and frustrations float away. The purpose is not to entertain or to distract, but to help calm, soothe, and surface your inner quiet. The videos contain scenes from the San Tomas Aquinas trail in Santa Clara, California.</description>
   * //  </channel>
   * // </rss>
   */
  get innerXML() { return this.children.join('\n') }
  set innerXML(value) {
    if (null === value || '' === value) {
      this.remove(...this.children)
      return
    }

    if (value instanceof this.constructor) {
      this.remove(...this.children)
      this.appendChild(value)
      return
    }

    if (Array.isArray(value)) {
      this.remove(...this.children)

      for (const child of value) {
        if (child instanceof this.constructor) {
          this.appendChild(child)
        }
      }

      return
    }

    if ('string' !== typeof value) {
      throw new TypeError('Invalid value when setting \'innerXML\'')
    }

    const pre = `<node>\n`
    const post = `\n</node>`
    const source = pre + value + post
    const parser = Parser.from(validate(source))

    this.remove(...this.children)

    if (parser.rootNode) {
      this.append(...parser.rootNode.children)
    }
  }

  /**
   * The outer XML representation of this node.
   * Setting the outer XML of this node will update the attributes,
   * name, and children of this node instance. If a string is given,
   * it is parsed and will represent the new node If a `ParserNode`
   * instance is given it will be used to derive the node's new state.
   * @public
   * @accessor
   * @type {String}
   * @example
   * const node = ParserNode.empty()
   * node.outerXML = `
   *  <rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
   *    <channel>
   *      <title>Calm Meditation</title>
   *      <link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
   *      <description>Contains short videos capturing still scenes from nature with a music background, intended for calming or meditation purposes. When you're stressed out or upset, watch a few videos. As your mind focuses on the small details, let your worries and frustrations float away. The purpose is not to entertain or to distract, but to help calm, soothe, and surface your inner quiet. The videos contain scenes from the San Tomas Aquinas trail in Santa Clara, California.</description>
   *    </channel>
   *  </rss>
   * `
   */
  get outerXML() { return this.toString() }
  set outerXML(value) {
    if (null === value || '' === value) {
      this.name = ''
      this.remove(...this.children)
      return
    }

    if (value instanceof this.constructor) {
      this.name = value.originalName || value.name
      this.remove(...this.children)
      this.append(...value.child)
      return
    }

    if ('string' !== typeof value) {
      throw new TypeError('Invalid value when setting \'outerXML\'')
    }

    const parser = Parser.from(validate(value))

    if (parser.rootNode) {
      this.name = parser.rootNode.originalName

      this.attributes.clear()
      this.attributes.set(parser.rootNode.attributes)

      this.remove(...this.children)
      this.append(...parser.rootNode.children)
    }
  }

  /**
   * The original name of this node.
   * @public
   * @accessor
   * @type {String}
   */
  set originalName(value) {  }
  get originalName() { return '' }

  /**
   * The normalized name of this node in camelcase.
   * @public
   * @accessor
   * @type {String}
   */
  set name(value) {  }
  get name() { return '' }

  /**
   * An alias to `this.body`.
   * @public
   * @accessor
   * @type {ParserNodeText}
   */
  set text(value) { void value }
  get text() {
    return this.children.filter((c) => c.isText).join(' ')
  }

  /**
   * The depth this node appears in the tree.
   * @public
   * @accessor
   * @type {Number}
   */
  set depth(value) {  }
  get depth() { return 0 }

  /**
   * A reference to the parent node of this node.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  set parent(value) {  }
  get parent() { return null }

  /**
   * A reference to the options used when this instance was created
   * @public
   * @accessor
   * @type {?Object}
   */
  set options(value) {  }
  get options() { return 0 }

  /**
   * A reference to the child nodes in this node.
   * @public
   * @accessor
   * @type {Array<ParserNode>}
   */
  set children(value) {  }
  get children() { return null }

  /**
   * A reference to the comment nodes in this node.
   * @public
   * @accessor
   * @type {Array<ParserNode>}
   */
  set comments(value) {  }
  get comments() { return null }

  /**
   * A key-value mapping of normalized attributes in this node.
   * @public
   * @accessor
   * @type {Object}
   */
  set attributes(value) {  }
  get attributes() { return null }

  /**
   * The original attributes, before normalization.
   * @public
   * @accessor
   * @type {?Object}
   */
  set originalAttributes(value) {  }
  get originalAttributes() { return null }

  /**
   * `true` if this node is connected to a parent node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isConnected() {
    return Boolean(this.parent)
  }

  /**
   * `true` if this node is not connected to a parent node and is not a root node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isOrphaned() {
    return !this.isConnected && 0 === this.children.length
  }

  /**
   * `true` to indicate that this is a node.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isParserNode() {
    return true
  }

  /**
   * `false` to indicate that this node is not text.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isText() {
    return false
  }

  /**
   * `false` to indicate that this node is not a fragment.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isFragment() {
    return false
  }

  /**
   * Computed index this node exists in its parent tree.
   * @public
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
   * @public
   * @accessor
   * @type {Number}
   */
  get length() {
    return this.children.length || 0
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
   * @public
   * @param {ParserNode} parent
   * @param {ParserNode} node
   */
  ondisconnect(parent, node) {
    void parent, node
  }

  /**
   * Computed keys for this parser node.
   * @public
   * @return {Array<String>}
   */
  keys() {
    return ['name', 'attributes', 'children', 'length', 'text']
  }

  /**
   * Computed values for this parser node.
   * @public
   * @return {Array<String>}
   */
  values() {
    const keys = this.keys()
    return keys.map((key) => this[key])
  }

  /**
   * Checks if node is contained within this one.
   * @public
   * @param {ParserNode} node
   * @return {Boolean}
   */
  includes(node) {
    return node && node.parent === this && node.children.includes(node)
  }

  /**
   * Append one or more nodes to this node.
   * @public
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
   * @public
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
   * @public
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

    return node
  }

  /**
   * Removes a child node to this node.
   * @public
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

    if (node.parent && this !== node.parent) {
      const index = node.parent.children.indexOf(node)
      node.parent = null
      if (-1 !== index) {
        node.parent.children.splice(index, 1)
      }
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
   * @public
   * @param {?Boolean} [deep = false] - Clone children
   * @return {ParserNode}
   */
  clone(deep, ...args) {
    const cloned = this.constructor.from(this, ...args)
    if (true === deep) {
      for (const child of this.children) {
        cloned.appendChild(child.clone(true))
      }
    }

    return cloned
  }

  /**
   * An alias to `clone()`.
   * @public
   * @return {ParserNode}
   */
  cloneNode(...args) {
    return this.clone(...args)
  }

  /**
   * Query the document object model represented by this node
   * using "JSONata" query syntax.
   * @public
   * @param {?String} [queryString = '$'] - A "JSONata" query string
   * @param {?Object} opts - Query options
   * @param {?Boolean} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
   * @return {Array|Object|null}
   * @see {@link https://jsonata.org}
   * @example
   */
  query(queryString, opts) {
    // lazy load
    const { query } = require('./query')
    return query(this, queryString, opts)
  }

  /**
   * Returns an iterable generator for this node.
   * @public
   * @return {Generator}
   */
  iterator() {
    return this[Symbol.iterator]()
  }

  /**
   * Converts this node ands children to a XML string
   * representing this node and its children.
   * @public
   * @param {?Object} opts
   * @param {?Boolean} [opts.attributes = true] - Include attributes in the result
   * @param {?Boolean} [opts.normalize = false] - Normalize tag and attributes names
   * @param {?Boolean} [opts.children = true] - Include children in the result
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

    const { children } = this
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

    if (!children.length || false === opts.children) {
      selfClosingTag = '/'
    }

    output += `${indent}<${[name, serializedAttributes, selfClosingTag].filter(Boolean).join(' ')}>`

    const containsOnlyTextNodes = (
      children &&
      children.length &&
      children.filter((c) => c.isText && c.length).length > 0
    )

    if (false !== opts.children && children && children.length) {
      for (const child of children) {
        if (!child) { continue }
        if (child.isText) {
          if (child.length) {
            output += child.toString()
          }
        } else {
          output += '\n'
          output += child.toString({ ...opts, depth: depth + 1 })
        }
      }
    }

    if (!containsOnlyTextNodes) {
      if (false !== opts.children && children && children.length) {
        if ('\n' !== output.slice(-1)[0]) {
          output += '\n'
        }
      } else if (!selfClosingTag && children && children.length) {
        output += '\n'
      }
    }

    if (!selfClosingTag) {
      if (!containsOnlyTextNodes) {
        output += `${indent}</${name}>`
      } else {
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
   * @public
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

    const { text, children } = this
    const output = { name, text }

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
   * @public
   * @return {Iterator}
   */
  *[Symbol.iterator]() {
    for (let i = 0; i < this.length; ++i) {
      yield this.children[i]
    }
  }

  /**
   * Implements a simple `slice` function to slice a selection of children
   * @public
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
   * @public
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
   * @public
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * @example
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
   * @public
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * @example
   * const nodes = node.query('**[name="asset"]')
   * const mapped = nodes.flatMap((node) => node)
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
   * @public
   * @param {Function} fn
   * @param {?Object} thisArg
   * @return {ParserNode}
   * @example
   * const nodes = node.query('.*[name="asset"]')
   * const filtered = nodes.filter((node) => 'app' in node.attributes)
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
   * @public
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
 * @public
 * @memberof parser
 */
class ParserState {

  /**
   * `ParserState` class constructor.
   * @public
   * @param {?Array} stack
   */
  constructor(stack) {
    this.stack = stack || []
  }

  /**
   * The first node in the parser state stack.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get head() {
    return this.stack[0] || null
  }

  /**
   * The last node in the parser state stack.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get tail() {
    const index = Math.max(0, this.stack.length - 1)
    return this.stack[index] || null
  }

  /**
   * The number of nodes in the parser state stack.
   * @public
   * @accessor
   * @type {Number}
   */
  get length() {
    return this.stack.length || 0
  }

  /**
   * An alias to `state.length`
   * @public
   * @accessor
   * @type {Number}
   */
  get depth() {
    return this.length
  }

  /**
   * Push one or more nodes on to the state stack.
   * @public
   * @param {ParserNode} ...nodes
   * @return {ParserState}
   */
  push(...nodes) {
    this.stack.push(...nodes)
    return this
  }

  /**
   * Pop off the tail of the parser state stack and return it.
   * @public
   * @return {?ParserNode}
   */
  pop() {
    return this.stack.pop() || null
  }

  /**
   * Clear the stack state.
   */
  clear() {
    this.stack.splice(0, this.length)
  }
}

/**
 * Callback handlers for a `Parser` instance.
 * @public
 * @memberof parser
 * @see {@link https://github.com/fb55/htmlparser2}
 * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L155}
 */
class ParserHandler {

  /**
   * A reference to the parser state head.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get rootNode() {
    return this.parser.state.head
  }

  /**
   * A reference to the parser state tail.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get currentNode() {
    return this.parser.state.tail
  }

  /**
   * Called when the parser handler is initialized.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {Parser} parser
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L156}
   */
  onparserinit(parser) {
    debug('ParserHandler::onparserinit')
    this.parser = parser
  }

  /**
   * Called when the parser handler is reset.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method._
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L161}
   */
  onreset() {
    debug('ParserHandler::onreset')
  }

  /**
   * Called when the parser is finished parsing.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method._
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L166}
   */
  onend() {
    debug('ParserHandler::onend')
    this.parser.onend()
  }

  /**
   * Called when the parser encounters an error.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {Error} err
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L167}
   */
  onerror(err) {
    debug('ParserHandler::onerror %s', err && err.message)
    this.parser.onerror(err)
  }

  /**
   * Called when the parser encounters an open tag.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
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
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {String} name
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L169}
   */
  onopentagname(name) {
    debug('ParserHandler::onopentagname %s', name)
  }

  /**
   * Called when the parser encounters a close tag
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {String} name
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L168}
   */
  onclosetag(name) {
    debug('ParserHandler::onclosetag %s', name)

    if (this.parser.state.length > 1) {
      this.parser.state.pop()
    } else {
      this.onend()
    }
  }

  /**
   * Called when the parser encounters an attribute key-value pair
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
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
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {String} text
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L182}
   */
  ontext(text) {
    text = text.trim()
    debug('ParserHandler::ontext %s', text)

    const { currentNode } = this

    if (currentNode && text && text.length) {
      currentNode.appendChild(ParserNodeText.from(text))
    }
  }

  /**
   * Called when the parser encounters a comment.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @param {String} data
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L183}
   */
  oncomment(data) {
    debug('ParserHandler::oncomment %s', data)

    const { currentNode } = this

    if (currentNode) {
      const comment = new ParserNode('', null, this.parser.state.depth, this.parser.options)
      comment.appendChild(ParserNodeText.from(comment))
      currentNode.comments.push(comment)
    }
  }

  /**
   * Called when the parser encounters the end of a comment.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L186}
   */
  oncommentend() {
    debug('ParserHandler::oncommentend')
  }

  /**
   * Called when the parser encounters CDATA.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L184}
   */
  oncdatastart() {
    debug('ParserHandler::oncdatastart')
  }

  /**
   * Called when the parser encounters the end of CDATA.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L185}
   */
  oncdataend() {
    debug('ParserHandler::oncdataend')
  }

  /**
   * Called when the parser encounters a processing instruction.
   *
   * _Extended classes overloading this method should be sure to call
   * the super method_.
   * @public
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L187}
   */
  onprocessinginstruction(name, data) {
    debug('ParserHandler::onprocessinginstruction', name, data)
  }
}

/**
 * Options with defaults for a `ParserHandler` instance
 * @public
 * @memberof parser
 * @see {@link https://github.com/fb55/htmlparser2}
 * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L101}
 */
class ParserOptions {

  /**
   * Create a new `ParserOptions` instance.
   * @public
   * @static
   * @param {?Object|ParserOptions} opts
   * @param {?Object} [opts.bindings = null] - JSONata query function bindings
   * @param {?ParserHandler} [opts.handler = null] - Parser runtime handler functions
   * @param {?ParserState} [opts.state = null] - Initial parser state
   * @param {Boolean} [opts.xmlMode = true] - Enable/disable XML mode for internal parser
   * @param {Boolean} [opts.lowerCaseTags = false] - Lowercase parsed tag names
   * @param {Boolean} [opts.decodeEntities = true] - Decode entities in parsed nodes
   * @param {Boolean} [opts.recognizeCDATA = true] - recognize
   * @return {ParserOptions}
   * @example
   * const options = ParserOptions.from({
   *   preserveConsecutiveUppercase: true,
   *   lowerCaseAttributeNames: true,
   *   bindings: {
   *     // `$propercase(string: String)`: String - convert string in query to propercase
   *     propercase(string) {
   *       return string[0].toUpperCase() + string.slice(1)
   *     }
   *   }
   * })
   */
  static from(opts) {
    return new this(opts)
  }

  /**
   * `ParserOptions` class constructor.
   * @protected
   * @param {?Object} opts
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
   * @public
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
   * @public
   * @param {String} key
   * @return {?Mixed}
   */
  get(key) {
    return key in this ? this[key] : null
  }

  /**
   * JSONata query runtime bindings for the parsed node tree.
   * @public
   * @accessor
   * @type {Object}
   * @see {@link https://docs.jsonata.org/embedding-extending#expressionregisterfunctionname-implementation-signature}
   */
  set bindings(value) { void value }
  get bindings() { return null }

  /**
   * Parser runtime handler functions for handling state building.
   * @public
   * @accessor
   * @type {ParserHandler}
   */
  set handler(value) { void value }
  get handler() { return null }

  /**
   * Parser runtime state that can be seeded optionally through `ParserOptions`.
   * @public
   * @accessor
   * @type {ParserState}
   */
  set state(value) { void value }
  get state() { return null }

  /**
   * Enable/disable XML mode for internal parser.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L110}
   */
  set xmlMode(value) { void value }
  get xmlMode() { return null }

  /**
   * Lowercase parsed tag names.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L124}
   */
  set lowerCaseTags(value) { void value }
  get lowerCaseTags() { return null }

  /**
   * Decode entities in parsed nodes.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L117}
   */
  set decodeEntities(value) { void value }
  get decodeEntities() { return null }

  /**
   * Recognize CDATA in parsed nodes.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L139}
   */
  set recognizeCDATA(value) { void value }
  get recognizeCDATA() { return null }

  /**
   * Recognize self closing tags when parsing tags.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L147}
   */
  set recognizeSelfClosing(value) { void value }
  get recognizeSelfClosing() { return null }

  /**
   * Lowercase parsed attribute names.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L131}
   */
  set lowerCaseAttributeNames(value) { void value }
  get lowerCaseAttributeNames() { return null }

  /**
   * Preserve consectutive uppercase when normalizing attributes and node names.
   * @public
   * @accessor
   * @type {Boolean}
   * @see {@link https://github.com/fb55/htmlparser2/blob/master/src/Parser.ts#L131}
   */
  set preserveConsecutiveUppercase(value) { void value }
  get preserveConsecutiveUppercase() { return null }
}

/**
 * An XML parser that creates a document object model.
 * @public
 * @memberof parser
 * @see {@link https://github.com/fb55/htmlparser2}
 */
class Parser extends htmlparser2.Parser {

  /**
   * Create a new `Parser` from input.
   * @public
   * @static
   * @param {Object|String|Parser} input
   * @return {Parser}
   */
  static from(input, ...args) {
    // handle Parser as input for copy
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

    // handle XML string as input
    if ('string' === typeof input || input instanceof String) {
      const parser = new this(...args)
      parser.write(validate(String(input)))
      parser.end()
      return parser
    }

    // handle ReadableStream as input
    if (input && 'function' === typeof input.pipe) {
      const parser = new this(...args)
      const bytes = []

      input.on('data', (data) => bytes.push(data))
      input.once('end', () => {
        const string = Buffer.concat(bytes).toString()

        try {
          parser.clear()
          parser.write(validate(string))
          parser.en()
        } catch (err) {
          input.emit('error', err)
        }
      })

      return parser
    }

    // handle Promise as input
    if (input && input.then) {
      const parser = new this(...args)

      input
        .then((result) => {
          // handle ReadableStream from Promise
          if (result && result.pipe) {
            const bytes = []
            result.on('data', (data) => bytes.push(data))
            result.once('end', () => {
              const string = Buffer.concat(bytes).toString()

              try {
                parser.clear()
                parser.write(validate(string))
                parser.end()
              } catch (err) {
                parser.onerror(err)
              }
            })
          }

          // handle XML string as input from Promise
          if ('string' === typeof result || result instanceof String) {
            parser.clear()
            parser.write(validate(String(result)))
            parser.end()
          }

          // handle result with `createReadStream()` interface
          if (result && result.createReadStream) {
            const bytes = []
            const stream = result.createReadStream()

            stream.on('data', (data) => bytes.push(data))
            stream.once('end', () => {
              const string = Buffer.concat(bytes).toString()

              try {
                parser.clear()
                parser.write(validate(string))
                parser.end()
              } catch (err) {
                parser.onerror(err)
              }
            })
          }

          // handle Parser copy from Promise
          if (result instanceof Parser) {
            const parser = new this({
              ...result.options,
              handler: result.handler,
              state: result.state,
            })

            parser.promise = result.promise.then(parser.promise)
            parser.ended = result.ended
            parser.error = result.error
          }
        })
        .catch((err) => {
          parser.onerror(err)
        })

      return parser
    }

    // generic input constructor
    return new this(input, ...args)
  }

  /**
   * Creates a `WritableStream` for a new `Parser` instance.
   * @public
   * @param {?ParserOptions} opts
   * @return {WritableStream}
   */
  static createWriteStream(opts) {
    const parser = new this(opts)
    return parser.createWriteStream()
  }

  /**
   * `Parser` class constructor.
   * @public
   * @param {?ParserOptions} opts
   */
  constructor(opts) {
    const { handler, state, ...parserOptions } = new ParserOptions(opts)
    let ended = false
    let error = null

    super(handler, parserOptions)

    this.promise = new InvertedPromise()

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
   * @public
   * @accessor
   * @type {ParserOptions}
   */
  set options(value) { void value }
  get options() { return null }

  /**
   * A reference to the parser state maintained by this parser instance.
   * @public
   * @accessor
   * @type {ParserState}
   */
  set state(value) { void value }
  get state() { return null }

  /**
   * A reference to the parser handlers that build the parser state for this instance.
   * @public
   * @accessor
   * @type {ParserHandler}
   */
  set handler(value) { void value }
  get handler() { return null }

  /**
   * A boolean to indicate if the parser has finished parsing its input.
   * @public
   * @accessor
   * @type {Boolean}
   */
  set ended(value) { void value }
  get ended() { return null }

  /**
   * An error, if one occurred during parsing.
   * @public
   * @accessor
   * @type {?Error}
   */
  set error(value) { void value }
  get error() { return null }

  /**
   * A pointer to the parsed state nodes
   * @public
   * @accessor
   * @type {Array}
   */
  get nodes() {
    return this.state.stack
  }

  /**
   * A pointer to the root node on the parsed state stack.
   * @public
   * @accessor
   * @type {ParserNode}
   */
  get rootNode() {
    return this.nodes[0] || null
  }

  /**
   * Returns the type of root node associated with this parser.
   * @public
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
   * @public
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
   * @public
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
   * Creates a `ReadableStream` for the `Parser` instance.
   * @public
   * @return {ReadableStream}
   * @see {@link https://github.com/streamxorg/streamx#readable-stream}
   * @example
   * parser.createReadStream().pipe(process.stdout)
   */
  createReadStream() {
    const { rootNode } = this
    const stream = new Readable({ read })
    const BYTES = 4096
    let view = null
    let i = 0

    process.nextTick(ontick)

    return stream

    function ontick() {
      try {
        view = Buffer.from(rootNode.toString())
      } catch (err) {
        stream.emit('error', err)
      }
    }

    function read(done) {
      const buffer = view.slice(i, i + BYTES)
      i += BYTES

      if (buffer.length) {
        this.push(buffer)
      } else {
        this.push(null)
      }

      done(null)
    }
  }

  /**
   * Query the root document object model using "JSONata" query syntax.
   * @public
   * @param {?String} [queryString = '$'] - A "JSONata" query string
   * @param {?Object} opts - Query options
   * @param {?Boolean} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
   * @return {?ParserNode|ParserNodeFragment|ParserNodeText}
   * @see {@link https://jsonata.org}
   * @example
   * const childrenFragment parser.query('[name="rss"]:children')
   */
  query(queryString, opts) {
    if (!this.rootNode) {
      // lazy load
      const { query } = require('./query')
      const empty = ParserNode.from('#empty', {}, this.options)
      return query(empty, queryString, opts)
    }

    return this.rootNode.query(queryString, opts)
  }

  /**
   * Clear the parser state
   */
  clear() {
    const { promise } = this
    this.promise = new InvertedPromise()
    this.ended = false
    this.error = null
    this.reset()
    this.state.clear()

    if (promise) {
      this.promise.then((result) => promise.resolve(result))
      this.promise.catch((err) => promise.reject(err))
    }
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
   * @public
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
   * Converts this instance into a string. Returns the root nodes
   * string value
   * @public
   * @return {String}
   * @example
   * const sourceString = parser.toString()
   */
  toString(...args) {
    return this.rootNode ? this.rootNode.toString(...args) : ''
  }
}

/**
 * The core parsing API for the MediaXML module that creates a document
 * object model for a parsed XML file with a robust query API built on top
 * of [JSONata](https://jsonata.org).
 * @public
 * @module parser
 * @example
 * const { Parser } = require('mediaxml/parser')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('package.xml') // ADI
 * const parser = Parser.from(stream)
 * parser.then(() => {
 *   const { rootNode } = parser
 *   const assets = parser.query('**[name="asset"]') // get all '<Asset />' nodes
 * })
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
