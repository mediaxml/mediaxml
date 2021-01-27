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
 * In addition to the [already built-in JSONata functions
 * ](https://docs.jsonata.org/array-functions), the following
 * functions are registered as JSONata syntax functions and can be used
 * in the query string.
 *
 * #### `$now(): int`
 *
 * The epoch in milliseconds as returned by `Date.now()`
 *
 * ```js
 * $now()
 * ```
 *
 * #### `$int(input: any): int`
 *
 * Converts input into an integer or `NaN`.
 *
 * ```js
 * [ $int(attr("timestamp")) > $now() ]
 * ```
 *
 * #### `$float(input: any): float`
 *
 * Converts input into a float or `NaN`.
 *
 * ```js
 * [ $float(attr("rating")) > 0.5 ]
 * ```
 *
 * #### `$camelcase(input: string): string`
 *
 * Converts input string into a camel case string.
 *
 * ```js
 * **.$camelcase(attr("value"))
 * ```
 *
 * #### `$concat(...input: (array | *)?): array`
 *
 * Concat input into a single array.
 *
 * ```js
 * $concat(**)
 * ```
 *
 * #### `$slice(node: (ParserNode | array), start: number, stop: number): array`
 *
 * Slice children or an array of items.
 *
 * ```js
 * **.$slice(children, 0, 2)
 * ```
 *
 * ### Query Selector Syntax
 *
 * The built in `query(node, queryString[, options]): ?*` function that is the
 * core query function for the node object model is built on
 * ["JSONata"](https://jsonata.org) query syntax with special query selector
 * syntax for working with {ParserNode} instances and other objects provided
 * by the **MediaXML** module.
 *
 * #### Root node reference
 *
 * The root node as defined by the `$` symbol in JSONata syntax can be
 * referenced by a less ambiguous syntax called `:root`
 *
 * ##### `:root`
 *
 * The root and its children can be referenced.
 *
 * ```js
 * :root:children
 * ```
 *
 * #### Reading node attributes
 *
 * `ParserNode` attributes can easily be read by simply accessing the property
 * on the instance like: `node.attributes.property`. However, one can query
 * this property directly or the entire attributes object itself in a query
 * string with a selector: `:?attr(name)` or `:attrs|:attributes`.
 *
 * ##### `:?attr(name)`
 *
 * Select an attribute by name.
 *
 * ```js
 * **:attr("providerId")
 * ```
 *
 * When filtering, omit the `:` like the example below:
 *
 * ```js
 * [ attr("providerId") = "12345" ]
 * ```
 *
 * ##### `:?attrs|:?attributes`
 *
 * The entire attributes object can be read in a similar way.
 *
 * ```js
 * **:attrs
 * ```
 *
 * ### Reading children
 *
 * Child nodes can easily be addressed by using the `:children` or
 * `nth-child()` selectors. A slice of the children can be selected or
 * just a single node.
 *
 * #### `:children`
 *
 * Selects all of the children of a node.
 *
 * ```js
 * [name="asset"]:children
 * ```
 *
 * Children of children can be selected in a similar way.
 *
 * ```js
 * [name="asset"]:children:children
 * ```
 *
 * #### `:?children([start[, stop])`
 *
 * Children can be selected in slices.
 *
 * ```js
 * [name="asset"]:children(0, 4)
 * ```
 *
 * The `stop` argument is optional and be omitted.
 *
 * ```js
 * [name="asset"]:children(4)
 * ```
 *
 * #### `:?nth-child(n)`
 *
 * The `nth` child can be selected.
 *
 * ```js
 * [name="asset"]:nth-child(4)
 * ```
 *
 * ### Reading object keys
 *
 * Objects, like a node's attributes, or the node itself can be enumerated
 * to list its keys.
 *
 * #### `:keys`
 *
 * The keys of an attributes object can be selected for each child.
 *
 * ```js
 * [name="asset"]:children:attrs:keys
 * ```
 *
 * The keys of a node can be selected too.
 *
 * ```js
 * [name="asset"]:attrs:keys
 * ```
 *
 * ### Reading node text
 *
 * The text contents of a node's body can be selected much like a
 * node's attributes
 *
 * #### `:text`
 *
 * The text of all children can be selected.
 *
 * ```js
 * **:text
 * ```
 *
 * The root node text can be selected in a similar way.
 *
 * ```js
 * :root:text
 * ```
 *
 * ### Reading data as JSON
 *
 * Objects can be converted to plain JSON structures by using the
 * `:json` selector. This is an alias to the `$json()` JSONata function.
 *
 * #### `:json`
 *
 * Attributes can be converted to JSON easily with the `:json` selector.
 *
 * ```js
 * :attrs:json
 * ```
 *
 * #### `as json|
 */
function query(node, queryString, opts) {
  queryString = queryString || '$' // reference to root node
  opts = { ...opts }

  const { Node = node.constructor, children = node.children } = opts
  const { model = {} } = opts

  const queryBindings = {
    ...bindings,
    ...node.options.bindings,
    ...opts.bindings,
  }

  const transforms = [
    require('./transform/prepare'),
    require('./transform/symbols'),
    require('./transform/as'),
    require('./transform/children'),
    require('./transform/attributes'),
    require('./transform/ordinals'),
    require('./transform/is'),
    require('./transform/typeof'),
    require('./transform/cleanup'),

    ...(!Array.isArray(opts.transform)
      ? [{ transform: opts.transform }]
      : opts.transform)
  ]

  let expression = cache.get(queryString)

  if (!expression) {
    debug('query: before transform', queryString)

    const reduceQueryString = (qs, t) => {
      return t && 'function' === typeof t.transform ? t.transform(qs) : qs
    }

    queryString = transforms.reduce(reduceQueryString, queryString)

    debug('query: after transform', queryString)

    expression = jsonata(queryString)
    cache.set(queryString, expression)

    for (const key in queryBindings) {
      const value = queryBindings[key]

      if ('function' === typeof value) {
        const { signature = '<x-:x>' } = value
        const fn = value.bind(node)
        debug('query: registering function `%s(%s)`', key, signature)
        expression.registerFunction(key, fn, signature)
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
 * @public
 * @module query
 */
module.exports = {
  cache,
  query
}
