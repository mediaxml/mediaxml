const { ParserNode, Parser } = require('./parser')

/**
 * An abstract document object model for XML.
 * @abstract
 * @class AbstractDocument
 * @extends ParserNode
 * @memberof document
 */
class AbstractDocument extends ParserNode {

  /**
   * The node name of the document. This static class property is an abstract
   * accessor used to define the name of the document node name. By default,
   * this value is an empty string.
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
   * @param {Function} callback
   * @return {Promise}
   */
  ready(callback) {
    return this.parser.then(callback)
  }
}

/**
 * An abstract document object model for XML.
 * @abstract
 * @class Document
 * @extends AbstractDocument
 * @memberof document
 */
class Document extends AbstractDocument {

  /**
   * The default node name of a document.
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
 * @module document
 */
module.exports = {
  AbstractDocument,
  Document
}
