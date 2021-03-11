const { inspect } = require('util')

/**
 * Base entity used as a base class for various porcelain classes.
 * @public
 * @abstract
 * @memberof entity
 * @example
 * const { Entity } = require('mediaxml/entity')
 *
 * class Programme extends Entity {
 *   get channel() {
 *     return this.attributes.channel
 *   }
 * }
 *
 * const node = document.query('[name="programme"]')
 * const programme = Programme.from(document, node)
 * console.log(programme.channel)
 */
class Entity {

  /**
   * Create an `Entity` from input.
   * @public
   * @static
   * @param {Document} document - The document this entity node is owned by
   * @param {ParserNode} node - The node this entity represents a view over
   * @return {Entity}
   * @example
   * const entity = Entity.from(document, node)
   */
  static from(document, node) {
    if (node && node.node) {
      return new this(document, node.node)
    } else {
      return new this(document, node)
    }
  }

  /**
   * `Entity` class constructor
   * @protected
   * @constructor
   * @param {Document} document - The document this entity node is owned by
   * @param {ParserNode} node - The node this entity represents a view over
   */
  constructor(document, node) {
    Object.defineProperty(this, 'document', {
      configurable: false,
      enumerable: false,
      value: document
    })

    Object.defineProperty(this, 'node', {
      configurable: false,
      enumerable: false,
      value: node
    })
  }

  /**
   * A reference to the children for this entity' node.
   * @public
   * @accessor
   * @type {Array}
   */
  get children() {
    return this.node.children
  }

  /**
   * A reference to the attributes for this entity' node.
   * @public
   * @accessor
   * @type {ParserNodeAttributes}
   */
  get attributes() {
    return this.node.attributes
  }

  /**
   * The text body for this entity' node.
   * @public
   * @accessor
   * @type {String}
   */
  get text() {
    return this.node.text || ''
  }

  /**
   * Computed keys for this instance
   * @public
   * @return {Array<String>}
   * @example
   * for (const key of entity.keys()) {
   *  console.log(key, entity[key])
   * }
   */
  keys() {
    let prototype = this.constructor.prototype
    const keys = Object.keys(this)

    while (prototype && Object.prototype !== prototype) {
      const descriptors = Object.getOwnPropertyDescriptors(prototype)
      const protoKeys = Object.keys(descriptors)
      prototype = Object.getPrototypeOf(prototype)
      keys.push(...protoKeys.filter((key) => filter(key, descriptors)))
    }

    return Array.from(new Set(keys))

    function filter(key, descriptors) {
      if (['constructor', 'document', 'children', 'attributes', 'text', 'node'].includes(key)) {
        return false
      }

      if (key in descriptors && descriptors[key].value) {
        return false
      }

      return true
    }
  }

  /**
   * Query the document object model represented by this entity
   * using "JSONata" query syntax.
   * @public
   * @param {?String} [queryString = '$'] - A "JSONata" query string
   * @param {?Object} opts - Query options
   * @return {Array|Object|null}
   * @see {@link https://jsonata.org}
   * @example
   * const now = Date()
   * entity.query(`programmes[$int(attr(start)) > $int("${now}")`)
   */
  query(queryString, opts) {
    return this.node.query(queryString, {
      model: this,
      ...opts,
    })
  }

  /**
   * Returns a plain JSON object of this instance.
   * @public
   * @return {Object}
   */
  toJSON() {
    return this.keys().reduce((json, key) => ({ ...json, [key]: this[key] }), {})
  }

  /**
   * Converts this entity to a string. Will return the internal node
   * body string by default.
   * @public
   * @return {String}
   */
  toString() {
    return this.text || ''
  }

  /**
   * Implements `util.inspect.custom` symbol for pretty output.
   * @private
   * @return {String}
   */
  [inspect.custom]() {
    const json = this.toJSON()
    const { name } = this.constructor
    return `${name} ${inspect(json, { colors: true })}`
  }
}

/**
 * A module for the base `Entity` used as a base class for
 * various porcelain classes.
 * @public
 * @module entity
 * @example
 * const { normalizeValue } = require('mediaxml/normalize')
 * const { Entity } = require('mediaxml/entity')
 * class Programme extends Entity {
 *   get channel() {
 *     return this.attributes.channel
 *   }
 *
 *   get start() {
 *     return normalizeValue(this.attributes.start)
 *   }
 *
 *   get stop() {
 *     return normalizeValue(this.attributes.stop)
 *   }
 * }
 *
 * const node = document.query('[name="programme"]')
 * const programme = Programme.from(document, node)
 * console.log(programme.channel, programme.start, programme.stop)
 */
module.exports = {
  Entity
}
