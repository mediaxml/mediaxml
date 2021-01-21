const { ParserNode, Parser } = require('./parser')

/**
 * An abstract document node.
 * @public
 * @abstract
 * @memberof document
 * @param {String} name
 * @param {?Object} attributes
 * @param {?Number} depth
 * @param {?Object} opts
 */
class Node extends ParserNode {

  /**
   * Creates a new `Node` from input.
   * @public
   * @static
   * @param {String|Node|Object} nameOrNode
   * @param {?Object} attributes
   * @param {?Object} opts
   * @return {Node}
   * @example
   * const node = Node.from('App_Data', { app: 'SVOD', name: 'Type', value: 'title' })
   * console.log(node)
   * // <App_Data app="SVOD" name="Type" value="title" />
   */
  static from (nameOrNode, attributes, opts) {
    return super.from(nameOrNode, attributes, opts)
  }
}

/**
 * An abstract document object model.
 * @public
 * @abstract
 * @memberof document
 */
class AbstractDocument extends ParserNode {

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
      return new this(Parser.from(input), opts)
    }

    if (input && input.pipe) {
      const stream = Parser.createWriteStream()
      const { parser } = input.pipe(stream)
      return new this(parser, opts)
    }

    // default parser
    return new this(new Parser(), opts)
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

    parser.then(() => {
      const { rootNode } = parser
      this.name = rootNode.originalName
      this.body = rootNode.body
      this.comments.push(...rootNode.comments)
      this.attributes.set(rootNode.attributes)
      this.children.splice(0, this.children.length, ...rootNode.children)
      Object.assign(this.originalAttributes, rootNode.originalAttributes)
    })
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
 * Module exports.
 * @public
 * @module document
 */
module.exports = {
  AbstractDocument,
  Document,
  Node
}
