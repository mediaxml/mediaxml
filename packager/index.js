const { Node } = require('../document')

/**
 * A container for a MediaXML packager that generates
 * media asset package manifest XML like ADI, ADI3, and MRSS.
 * @public
 * @class
 * @memberof packager
 */
class Packager {

  /**
   * Creates a `Packager` instance from a variety of input.
   * @public
   * @static
   * @param {Object} opts
   * @return {Packager}
   */
  static from(...args) {
    return new this(...args)
  }

  /**
   * `Packager` class constructor.
   * @protected
   * @constructor
   * @param {Object} opts
   */
  constructor(opts) {
    if (!opts) {
      throw new TypeError('Packager expecting options.')
    }

    this.manifest = Manifest.from(opts.manifest)
  }

  /**
   * Process and return manifest string.
   */
  process(opts) {
    return this.manifest.toString(opts)
  }
}

class Manifest {
  static from(input) {
    if (input instanceof Manifest) {
      return new this(input.data)
    }

    return new this(input)
  }

  constructor(data) {
    this.data = data
  }

  toNode(...args) {
    return Node.from(this.toJSON(), ...args)
  }

  toString(opts) {
    const { data } = this
    opts = { ...opts }

    const existingXmlAttributes = (
      data['@xml'] && 'object' === typeof data['@xml'] && !Array.isArray(data['@xml'])
      ? data['@xml']
      : {}
    )

    const header = {
      version: '1.0',
      encoding: 'UTF-8',
      ...existingXmlAttributes
    }

    const xml = this.toNode().toString()
    let output = ''

    if (opts.xml) {
      if ('string' === typeof opts.xml.version) {
        header.version = opts.xml.version
      }

      if ('string' === typeof opts.xml.encoding) {
        header.encoding = opts.xml.encoding
      }

      if (opts.xml.header && 'object' == typeof opts.xml.header) {
        for (const key in opts.xml.header) {
          const value = opts.xlm.header[key]
          if (value && 'string' === typeof value) {
            header[key] = value
          }
        }
      }
    }

    const xmlAttributes = Object
      .keys(header)
      .map((key) => `${key}="${header[key]}"`)
      .join(' ')

    output += `<?xml ${xmlAttributes}?>\n`
    output += xml
    return output.trim()
  }

  toJSON() {
    return visit('', this.data)
    function visit(name, target) {
      const node = { name, text: '', attributes: {}, children: [] }

      for (const key in target) {
        const value = target[key]

        if ('@' === key[0]) {
          if ('@type' === key.toLowerCase()) {
            if ('string' === typeof value) {
              node.name = value
            }
          } else {
            const type = key.slice(1)
            if (Array.isArray(value)) {
              if ('@children' === key) {
                node.children.push(...value.map((v) => visit('', v)))
              } else {
                const child = visit(type, {})
                child.children.push(...value.map((v) => visit('', v)))
                node.children.push(child)
              }
            } else if (value && Array.isArray(value['@children'])) {
              const child = visit(type, {})
              child.children.push(...value['@children'].map((v) => visit('', v)))
              node.children.push(child)
            }

            if ('@children' !== key && value && 'object' === typeof value && !Array.isArray(value)) {
              node.children.push(visit(type, value))
            }
          }
        } else if (!Array.isArray(value) && 'object' !== typeof value) {
          node.attributes[key] = value
        }
      }

      if (!node.name) {
        return null
      }

      return node
    }
  }
}

/**
 * A module that provides a packaging interface for generating various
 * MediaXML package manifests like ADI, ADI3, and mRSS.
 * @public
 * @module packager
 * @example
 * const { Packager } = require('mediaxml/packager')
 */
module.exports = {
  Packager
}
