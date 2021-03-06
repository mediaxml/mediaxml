const { ParserNode } = require('../parser')
const camelcase = require('camelcase')
const bindings = require('./bindings')
const defined = require('defined')
const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

/**
 * An internal cache used to cache compiled queries.
 * @public
 * @type {Map}
 * @memberof query
 * @example
 * const { cache } = require('mediaxml/query')
 * // clear the query cache of all entries (compiled expressions, etc)
 * cache.clear()
 */
const cache = new Map()

/**
 * @public
 * @param {?ParserNode} node - The parser node to query
 * @param {?String} [queryString = '$'] - A [JSONata](https://jsonata.org) query string
 * @param {?Object} opts - Query options
 * @param {?Object} [opts.model = {}] - An optional model to query, instead of one derived from the input `node`
 * @param {?Object} [opts.bindings = node.options.bindings] - Bindings to use instead of the ones derived from the input `node`
 * @param {?Object} [opts.assignmentss] - A key-value object of variable assignments. This function will modify this object.
 * @param {?Map} [opts.imports] - A map of existing imports. This function will modify this map.
 * @param {?Function} [opts.load] - An import loader function. This function must be given if queries use the `import <path|URL>` statement.
 * @return {?(ParserNode|ParserNodeFragment|String|*)}
 * @see https://jsonata.org
 * @memberof query
 *
 * @example
 * // select first node with node name "channel"
 * const channel = query(node, '[name="channel"]:first')
 *
 * @example
 * // select the 'href' attribute value from the first child with a node name
 * // of "atom:link" from the first "channel" node
 * const atom = query(node, '[name="channel"]:first:children:first[name="atom:link"]:attr(href)')
 *
 * @example
 * // select the text of the first node with a name that matches the
 * `/^offer:BillingId$/i` regular expression
 * const billingId = query(node, '[name ~> /^offer:BillingId$/i]:first:text')
 *
 * @description
 * Query the document object model represented by a node
 * using ["JSONata"](https://jsonata.org) query syntax with
 * special selector syntax for working with {ParserNode} instances.
 *
 * ### JSONata functions
 *
 */
function query(node, queryString, opts) {
  queryString = queryString || '$' // reference to root node
  opts = { ...opts }

  const { Node = node.constructor, children = node.children } = opts
  const { model = {} } = opts

  const queryBindings = {
    ...bindings,
    ...(node && node.options ? node.options.bindings : {}),
    ...opts.bindings,
  }

  const transforms = [
    require('./transform/prepare'),
    require('./transform/symbols'),
    require('./transform/children'),
    require('./transform/attributes'),
    require('./transform/ordinals'),
    require('./transform/hex'),
    require('./transform/as'),
    require('./transform/is'),
    require('./transform/has'),
    require('./transform/let'),
    require('./transform/print'),
    require('./transform/typeof'),
    require('./transform/import'),
    require('./transform/contains'),

    ...(opts.transform && !Array.isArray(opts.transform)
      ? [{ transform: opts.transform }]
      : opts.transform || []),

    ...((node && node.options && node.options.transform) || []),

    require('./transform/comments'),
    require('./transform/cleanup'),
  ]

  let expression = cache.get(queryString)
  const assignments = opts.assignments || {}
  const imports = opts.imports || new Map()
  const context = {
    bindings: queryBindings,
    assignments,
    imports,
    assign(key, value) {
      assignments[key] = value
    },

    import(target) {
      if (!imports.has(target)) {
        const tmp = {}
        const promise = new Promise((resolve, reject) => {
          Object.assign(tmp, { resolve, reject })
          if ('function' === typeof opts.load) {
            opts.load(target).then(resolve).catch(reject)
          } else {
            return reject(new Error('Missing import loader.'))
          }
        })

        imports.set(target, Object.assign(promise, tmp))
        return promise
      } else {
        return imports.get(target)
      }
    }
  }

  if (!expression) {
    debug('query: before transform', queryString)

    const reduceQueryString = (qs, t) => {
      return t && 'function' === typeof t.transform ? t.transform(qs, context) : qs
    }

    queryString = transforms.reduce(reduceQueryString, queryString)

    debug('query: after transform', queryString)

    expression = jsonata(queryString)
    cache.set(queryString, expression)

    for (const key in queryBindings) {
      const value = queryBindings[key]

      if ('function' === typeof value) {
        const { signature = '<x-:x>' } = value
        const fn = new Function('fn', `return function ${value.name || 'binding'}(...args) { return fn(...args) }`)(value)
        debug('query: registering function `%s(%s)`', key, signature)
        expression.registerFunction(key, value, signature)
      }
    }
  }

  if (!opts.model) {
    visit(model, node)
  }

  const target = model[node.originalName] || model[node.name] || model
  const result = expression.evaluate(target, assignments)

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
 * @public
 * @module query
 */
module.exports = {
  cache,
  query
}
