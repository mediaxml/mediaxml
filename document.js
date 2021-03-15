const { ParserNode, Parser } = require('./parser')
const { Entity } = require('./entity')

/**
 * An abstract document node.
 * @public
 * @abstract
 * @memberof document
 * @see [ParserNode](#parserparsernode)
 * @param {String} name
 * @param {?Object} attributes
 * @param {?Number} depth
 * @param {?Object} opts
 */
class Node extends ParserNode { }

/**
 * An abstract document object model.
 * @public
 * @abstract
 * @memberof document
 */
class AbstractDocument extends Node {

  /**
   * A reference to the `Node` class used by this
   * document.
   * @public
   * @static
   * @accessor
   * @type {Node}
   */
  static get Node() {
    return Node
  }

  /**
   * The node name of the document. This static class property is an abstract
   * accessor used to define the name of the document node name. By default,
   * this value is an empty string.
   * @public
   * @static
   * @abstract
   * @accessor
   * @type {String}
   */
  static get nodeName() {
    return ''
  }

  /**
   * Create a new `Document` instance from input
   * @public
   * @static
   * @param {Document|Parser|String|ReadableStream} input
   * @param {?Object} opts
   * @return {Document}
   */
  static from(input, opts) {
    const { nodeName } = this
    opts = { nodeName, ...opts }

    if (input instanceof this) {
      return new this(input.parser, opts)
    }

    if (input instanceof Parser) {
      return new this(input, opts)
    }

    if ('string' === typeof input) {
      if (/[<|>|=|"|'|.]+/g.test(input)) {
        return new this(Parser.from(input), opts)
      } else {
        return new this(Parser.from(input), {
          ...opts,
          nodeName: input
        })
      }
    }

    // default parser
    return new this(Parser.from(input), opts)
  }

  /**
   * `Document` class constructor.
   * @protected
   * @constructor
   * @param {Parser} parser
   * @param {?Object} opts
   */
  constructor(parser, opts) {
    opts = { ...opts }

    super(opts.nodeName, opts.attributes, 0, opts)

    this.parser = null

    Object.defineProperty(this, 'parser', {
      configurable: false,
      enumerable: false,
      value: parser
    })

    const init = () => {
      const { rootNode } = parser
      if (rootNode) {
        this.name = rootNode.originalName
        this.comments.push(...rootNode.comments)
        this.attributes.set(rootNode.attributes)
        this.children.splice(0, this.children.length, ...rootNode.children)
        Object.assign(this.originalAttributes, rootNode.originalAttributes)
      }
    }

    // sync
    if (parser.rootNode) {
      init()
    } else {
      parser.then(init)
    }
  }

  /**
   * Calls `callback()` when the document is "ready".
   * @public
   * @param {Function} callback
   * @return {Promise}
   */
  ready(callback) {
    return this.parser.then(callback)
  }

  /**
   * Creates and appends a child node to this node.
   * @public
   * @param {ParserNode} node
   * @return {ParserNode}
   * @throws TypeError
   */
  createChild(...args) {
    const child = this.constructor.Node.from(...args)
    return this.appendChild(child)
  }

  /**
   * Computed keys for this instance.
   * @return {Array<String>}
   */
  keys() {
    return Entity.prototype.keys.call(this, { Super: Node })
  }

  /**
   * Returns a plain JSON object of this instance.
   * @public
   * @return {Object}
   */
  toJSON() {
    return this.keys().reduce((json, key) => ({ ...json, [key]: this[key] }), {})
  }
}

/**
 * An abstract document object model for XML.
 * @public
 * @abstract
 * @memberof document
 * @param {Parser} parser
 * @param {?Object} opts
 */
class Document extends AbstractDocument {

  /**
   * The default node name of a document.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get nodeName() {
    return 'xml'
  }
}

/**
 * Factory for creating `Document` instances.
 * @public
 * @memberof document
 * @return {Document}
 */
function createDocument(...args) {
  return Document.from(...args)
}

/**
 * Factory for creating `Node` instances.
 * @public
 * @memberof document
 * @return {Node}
 */
function createNode(...args) {
  return Node.from(...args)
}

/**
 * A core module for working with and building XML documents. The
 * interfaces provided by this module are porcelain and be used instead
 * of the [_parser API_](#parser).
 * @public
 * @module document
 * @see [ParserNode](#parserparsernode)
 * @example
 * const { createDocument, createNode } = require('mediaxml/document')
 *
 * const assets = []
 * const document = createDocument(`
 * <?xml version="1.0"?>
 * <package>
 *   <assets />
 * </package>
 * `)
 *
 * assets.push(createNode('asset', {
 *   name: 'first',
 *   url: 'https://example.com/first.mp4'
 * }))
 *
 * assets.push(createNode('asset', {
 *   name: 'second',
 *   url: 'https://example.com/second.mp4'
 * }))
 *
 * document.query('[name="assets"]').append(...assets)
 *
 * console.log(document)
 * // <package>
 * //   <assets>
 * //     <asset name="first" url="https://example.com/first.mp4" />
 * //     <asset name="second" url="https://example.com/second.mp4" />
 * //   </assets>
 * // </package>
 *
 * const urls = document.query('**[name="asset"]:attr(url)')
 *
 * console.log(urls)
 * // ParserNodeFragment(2) [
 * //   'https://example.com/first.mp4',
 * //   'https://example.com/second.mp4'
 * // ]
 */
module.exports = {
  AbstractDocument,
  createDocument,
  createNode,
  Document,
  Node
}
