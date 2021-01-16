const { inspect } = require('util')

/**
 * Base entity used as a base class for various porcelain classes.
 * @abstract
 * @class Entity
 * @memberof entity
 */
class Entity {

  /**
   * Create an `Entity` from input.
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

    for (const [ key, value ] of node.attributes) {
      Object.defineProperty(this, key, { value })
    }
  }

  /**
   * A reference to the attributes for this entity' node.
   * @accessor
   * @type {ParserNodeAttributes}
   */
  get attributes() {
    return this.node.attributes
  }

  /**
   * Computed keys for this instance
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
      if (['constructor', 'document', 'attributes', 'node'].includes(key)) {
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
   * @return {Object}
   */
  toJSON() {
    return this.keys().reduce((json, key) => ({ ...json, [key]: this[key] }), {})
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
 * Module exports.
 * @module entity
 */
module.exports = {
  Entity
}
