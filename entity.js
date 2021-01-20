const { inspect } = require('util')

/**
 * Base entity used as a base class for various porcelain classes.
 * @public
 * @abstract
 * @memberof entity
 */
class Entity {

  /**
   * Create an `Entity` from input.
   * @public
   * @static
   * @param {Document} document
   * @param {ParserNode} node
   * @return {Entity}
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
   * @param {Document} document
   * @param {ParserNode} node
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
    return this.node.body || ''
  }

  /**
   * Computed keys for this instance
   * @public
   * @return {Array<String>}
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
      if (['constructor', 'document', 'attributes', 'text', 'node'].includes(key)) {
        return false
      }

      if (key in descriptors && descriptors[key].value) {
        return false
      }

      return true
    }
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
    return this.node.body || ''
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
 */
module.exports = {
  Entity
}
