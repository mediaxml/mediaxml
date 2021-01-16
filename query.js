const { toWordsOrdinal } = require('number-to-words')
const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

const {
  normalizeAttributeValue,
  normalizeAttributeKey,
  normalizeAttributes,
  normalizeValue
} = require('./normalize')

/**
 * An internal cache used to cache compiled queries.
 * @protected
 * @type {Map}
 * @memberof query
 */
const cache = new Map()

/**
 * Query the document object model represented by a node
 * using "JSONata" query syntax.
 * @param {?ParserNode} node - The parser node to query
 * @param {?String} [query = '$'] - A "JSONata" query string
 * @param {?Object} opts - Query options
 * @param {?Boolean} [opts.inspect = false] - If `true`, will set `util.inspect.custom` symbols
 * @return {Array|Object|null}
 * @see {@link https://jsonata.org}
 * @memberof query
 * @example
 */
function query(node, queryString, opts) {
  queryString = queryString || '$' // reference to root node
  opts = { ...opts }

  const { Node = node.constructor, children = node.children } = opts
  const { bindings = node.options.bindings } = opts
  const { model = {} } = opts

  let expression = cache.get(queryString)

  if (!expression) {
    const ordinals = []

    for (let i = 0; i < children.length; ++i) {
      ordinals.push(toWordsOrdinal(i + 1))
    }

    debug('query: before preparation', queryString)

    // JSONata clean up and sugars
    queryString = queryString
      .trim()
      // add '*' by default because we are always searching the same node hierarchy
      .replace(/^\[/, '*[')
      // `:keys` - selector to return the keys of the target
      .replace(/:keys/g, '.$keys($)')
      // `:text` - selector to return body text of node
      .replace(/:text/g, '.body.text')
      // `:children()` - selector to return child nodes
      .replace(/:children\(([\s]+)?\)/g, '.children')
      // `:children(start[, stop]) - slice children into a fragment array
      .replace(/(:children\()([0-9]+)?\s?(,?)\s?([0-9]+)?(.*)(\))/, '.$slice(children, $2$3$4)')
      // `:children` - fallback and alias for `.children` property access
      .replace(/:children/g, '.children')
      // `attr(key)` attribute selector
      .replace(/:attr\((.*)\)/g, (str, name, offset, source) => {
        const prefix = /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}attributes.${normalizeAttributeKey(name)}`
      })
      // `:attr or `:attributes` - gets all attributes
      .replace(/:attr(s)?(ibutes)?(\(\))?/g, (_, $1, $2, $3, offset, source) => {
        const prefix = /(\(|\[|\.|^$)/.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}attributes`
      })
      // `:nth-child(n)` - return the nth child of the node
      .replace(/:nth-child\(([0-9]+)\)/g, '.children[$1]')
      // `:{first,second,...,last} - return the nth node denoted by an ordinal
      .replace(RegExp(`^\((\:)(${ordinals.join('|')})\)`, 'i'), '$1$2')
      // `:is(type)` - predicate function to determine type
      .replace(/:is\(([a-z|A-Z|_|0-9]+)\)/g, (_, type, offset, source) => {
        const prefix = /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        switch (type) {
          case 'text': return prefix + 'isText'
          case 'node': return prefix + 'isParserNode'
          case 'fragment': return prefix + 'isFragment'
          default: return prefix + `is${camelcase(type)}`
        }
      })

    debug('query: before ordinals', queryString)

    for (let i = 0; i < ordinals.length; ++i) {
      queryString = queryString.replace(RegExp(`\:${ordinals[i]}`, 'g'), (ordinal, offset, source) => {
        return `[${i}]`
      })

      if (i === ordinals.length - 1) {
        queryString = queryString.replace(RegExp(`\:last`, 'g'), `[${i}]`)
      }
    }

    queryString = queryString.replace(/^[.|\,]+/, '$.')

    debug('query: final', queryString)

    expression = jsonata(queryString)
    cache.set(queryString, expression)

    // $camelcase(input: string): string
    expression.registerFunction('camelcase', (...args) => camelcase(...args))

    // $slice(node: ParserNode, start: number, stop: number): Array
    expression.registerFunction('slice', function (node, start, stop) {
      if (node && node.children) {
        return node.children.slice(start, stop)
      } else if (node.slice) {
        return node.slice(start, stop)
      } else {
        return node
      }
    })

    for (const key in bindings) {
      const value = bindings[key]

      if ('function' === typeof value) {
        expression.registerFunction(key, value.bind(node))
        debug('query: expression function register:', key)
      }
    }
  }

  if (!opts.model) {
    visit(model, node)
  }

  const target = model[node.originalName] || model[node.name] || model
  const result = expression.evaluate(target)

  if (result) {
    delete result.sequence
  }

  if (Array.isArray(result)) {
    return Node.createFragment(null, {
      children: result
    })
  }

  return result || null

  function visit(target, node) {
    const children = node.children.map((child) => child && child.children ? visit({}, child) : child)

    let { originalName: name, attributes } = node

    // use normalized values if requested
    if (opts.normalize) {
      name = node.name
    }

    if (!target[name]) {
      const proxy = makeParserNodeProxy(node, { children, attributes })

      Object.defineProperty(target, name, {
        configurable: false,
        enumerable: true,
        value: proxy
      })

      if (name !== node.name) {
        Object.defineProperty(target, node.name, {
          configurable: false,
          enumerable: false,
          get: () => proxy
        })
      }

      const originalNameLowerCased = node.originalName.toLowerCase()
      if (
        name !== originalNameLowerCased &&
        false === (originalNameLowerCased in target)
      ) {
        Object.defineProperty(target, originalNameLowerCased, {
          configurable: false,
          enumerable: false,
          get: () => proxy
        })
      }

      Object.defineProperties(target, {
        _data: {
          configurable: false,
          enumerable: false,
          value: node
        }
      })

      const descriptors = Object.getOwnPropertyDescriptors(target)
      for (const key in attributes) {
        if (false === (key in descriptors)) {
          Object.defineProperty(target, key, {
            configurable: false,
            enumerable: false,
            get: () => attributes[key]
          })
        }
      }
    }

    return target
  }
}

/**
 * Factory for hybrid proxied objects supporting both arrays and objects
 * @private
 * @param {Array|Object}
 * @return {Proxy}
 */
function makeParserNodeProxy(object, state) {
  return new Proxy(object, Object.create({
    enumerate() {
      return ownKeys()
    },

    ownKeys() {
      return ownKeys()
    },

    set(_, key, value) {
      object[key] = value
    },

    get(_, key, reciever) {
      if (Array.isArray(object) || object.isFragment) {
        // for JSONata
        if ('sequence' === key) {
          return true
        }
      }

      if ('children' === key) {
        return object.children
      }

      if (key in object || undefined !== object[key]) {
        return object[key]
      }

      if (key in state.attributes || undefined !== state.attributes[key]) {
        return state.attributes[key]
      }

      return object[key] || undefined
    }
  }))

  function ownKeys() {
    const keys = Object.keys(object)

    if (
      'function' === typeof object.constructor.isParserNode &&
      object.constructor.isParserNode(object)
    ) {
      const descriptors = Object.getOwnPropertyDescriptors(object)
      const { prototype } = object.constructor
      const prototypeDescriptors = Object.getOwnPropertyDescriptors(prototype)

      for (const key in prototypeDescriptors) {
        keys.push(key)
      }

      for (const key in descriptors) {
        keys.push(key)
      }
    }

    if (state.attributes) {
      keys.push(...Object.keys(state.attributes))
    }

    if (object.length && !keys.includes('length')) {
      keys.push('length')
    }

    if (object.options) {
      keys.push('options')
    }

    keys.push(...object.children.map((child) => child.name).filter(Boolean))

    return Array.from(new Set(keys))
  }
}

/**
 * Module exports.
 * @module query
 */
module.exports = {
  cache,
  query
}
