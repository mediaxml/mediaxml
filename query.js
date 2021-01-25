const { toWordsOrdinal } = require('number-to-words')
const camelcase = require('camelcase')
const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

const { ParserNode } = require('./parser')

const {
  normalizeAttributeValue,
  normalizeAttributeKey,
  normalizeAttributes,
  normalizeValue,
  normalizeKey
} = require('./normalize')

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
 * `:json` selector. This is an alias to the `$toJSON()` JSONata function.
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
  const { bindings = node.options.bindings } = opts
  const { model = {} } = opts

  let expression = cache.get(queryString)

  if (!expression) {
    const ordinals = []

    for (let i = 0; i < 10; ++i) {
      ordinals.push(toWordsOrdinal(i + 1))
    }

    debug('query: before preparation', queryString)

    // JSONata clean up and sugars
    queryString = queryString
      .trim()
      // replace trailing `:` with `.`
      .replace(/\:$/, '.')
      // add '*' by default because we are always searching the same node hierarchy
      .replace(/^\[/, '*[')
      // `:name` - selector to return the current node name
      .replace(/:name/g, '.name')
      // `:key` - selector to return the 'key' property
      .replace(/:key/g, '.key')
      // `:value` - selector to return the 'value' property
      .replace(/:value/g, '.value')
      // `:root` - selector to return the current root
      .replace(/:root/g, '$')
      // `:keys` - selector to return the keys of the target
      .replace(/:keys/g, '.$keys($)')

      // `(:|as)json` - selector to return JSON object representation of target
      .replace(/(:|as)\s*json/g, '~> $toJSON($)')
      // `(:|as)tuple` - selector to return tuple key-value pair of target
      .replace(/(:|as)\s*tuple/g, '~> $toTuple($)')
      // `(:|as)number` - selector to return number representation of target
      .replace(/(:|as)\s*(number|float)/g, '~> $float($)')
      // `(:|as)int` - selector to return number representation of target
      .replace(/(:|as)\s*int/g, '~> $int($)')
      // `(:|as)string` - selector to return string representation of target
      .replace(/(:|as)\s*string/g, '~> $string($)')
      // `(:|as)array` - selector to return array representation of target
      .replace(/(:|as)\s*array/g, '~> $array($)')

      // `:children()` - selector to return child nodes
      .replace(/(:|a^)?children\(([\s]+)?\)/g, (_, $1, $2, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return '.children'
      })
      // `:children(start[, stop]) - slice children into a fragment array
      .replace(/(:|a^)?(children\()([0-9]+)?\s?(,?)\s?([0-9]+)?(.*)(\))/, (_, $1, $2, $3, $4, $5, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}$slice(children, ${$3}${$4}${$5})`
      })
      // `:children` - fallback and alias for `.children` property access
      .replace(/:children/g, '.children')
      // `attr(key)` attribute selector
      .replace(/(:)?attr\(['|"|`]?([0-9|-|_|a-z|A-Z|\:]+)['|"|`]?\)/g, (str, $1, name, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        name = normalizeKey(name)
        return `${prefix}attributes.${name}`
      })
      // `:attr or `:attributes` - gets all attributes
      .replace(/(:)?attr(s)?(ibutes)?(\(\))?/g, (_, $1, $2, $3, $4, offset, source) => {
        const prefix = ':' !== $1 || /(\(|\[|\.|^$)/.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}attributes`
      })
      // `:nth-child(n)` - return the nth child of the node
      .replace(/(:|a^)?nth-child\(([0-9]+)\)/g, (_, $1, $2, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}children[${$2}]`
      })
      // `:{first,second,...,last} - return the nth node denoted by an ordinal
      .replace(RegExp(`^\((\:)(${ordinals.join('|')})\)`, 'i'), '$1$2')
      .replace(/(is)\s*(node|text|node|fragment)/ig, (_, $1, $2) => `is(${$2.toLowerCase()})`)
      // `:is(type)` - predicate function to determine type
      .replace(/(:|a^)?is\(\s*([a-z|A-Z|_|-|0-9|.]+\s*[a-z|A-Z|_|-|0-9|.]+)\s*\)/g, (_, $1, type, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        type = type.replace(/(not)(\s*)(null)/ig, (_, $1) => `${($1 || '').toLowerCase()} null`.trim())
        type = type.replace(/(node|text|null|fragment)/gi, (_, $1) => $1.toLowerCase())
        switch (type) {
          case 'not null': return '!= null'
          case 'null': return '= null'
          case 'text': return prefix + 'isText'
          case 'node': return prefix + 'isParserNode'
          case 'fragment': return prefix + 'isFragment'
          default: return prefix + `is${camelcase(type)}`
        }
      })
      // `:match` - selector to return match from regex
      .replace(/(:)match/g, (_, $1, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}match`
      })
      // `:text` - selector to return body text of node
      .replace(/(:)text/g, (_, $1, offset, source) => {
        const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
        return `${prefix}body.text`
      })
      // lowercase special key words
      .replace(/\s?(AND|OR|NULL)\s?/g, ($1) => $1.toLowerCase())
      .replace(/\s?(And|Or|Null)\s?/g, ($1) => $1.toLowerCase())
      // transform 'IS NOT NULL' -> '!= null'
      .replace(/is not null/ig, '!= null')
      // transform 'IS NULL' -> '== null'
      .replace(/is null/ig, '= null')

    debug('query: before ordinals', queryString)

    for (let i = 0; i < ordinals.length; ++i) {
      queryString = queryString.replace(RegExp(`\:${ordinals[i]}`, 'g'), (ordinal, offset, source) => {
        return `[${i}]`
      })
    }

    queryString = queryString.replace(RegExp(`\:last`, 'g'), `.$slice($, -1)[0]`)
    queryString = queryString.replace(/^[.|\,]+/, '$.')

    debug('query: final', queryString)

    expression = jsonata(queryString)
    cache.set(queryString, expression)

    // $print(...input: any): int
    expression.registerFunction('print', (...input) => {
      return console.log(...input)
    })

    // $toJSON(): (object | array | string | number | boolean)?
    expression.registerFunction('toJSON', function toJSON(input) {
      if ('string' === typeof input) {
        try {
          return JSON.parse(input)
        } catch (err) {
          return input
        }
      } else if (input && 'function' !== typeof input) {
        if (Array.isArray(input)) {
          return input.map(toJSON)
        } else {
          input = input.toJSON ? input.toJSON() : input
          return JSON.parse(JSON.stringify(input))
        }
      } else {
        return null
      }
    })

    // $toNumber(): int
    expression.registerFunction('toNumber', (input) => {
      return input
    })

    // $toTuple(): int
    expression.registerFunction('toTuple', (input) => {
      if (input) {
        if ('function' === typeof input.keys && 'function' === typeof input.values) {
          const keys = input.keys()
          const values = input.values()
          const result = []

          for (let i = 0; i < keys.length; ++i) {
            result.push({key: keys[i], value: values[i]})
          }

          return result
        } else {
          const keys = Object.keys(input)
          const values = Object.values(input)
          const result = []

          for (let i = 0; i < keys.length; ++i) {
            result.push({key: keys[i], value: values[i]})
          }

          return result
        }
      }
    })

    // $now(): int
    expression.registerFunction('now', (input) => Date.now())

    // $length(input: any): int
    expression.registerFunction('length', (input) => {
      if (input && input.length) {
        return input.length
      } else if (!input) {
        return 0
      } else {
        return String(input).length
      }
    })

    // $keys(input: any): array
    expression.registerFunction('keys', (input) => {
      if (input && 'function' === typeof input.keys) {
        return input.keys()
      } else {
        return Object.keys(input)
      }
    })

    // $int(input: any): int
    expression.registerFunction('int', (input) => parseInt(+normalizeValue(String(input))))

    // $float(input: any): float
    expression.registerFunction('float', (input) => parseFloat(+normalizeValue(String(input))))

    // $string(input: any): string
    expression.registerFunction('string', (input) => String(input))

    // $array(input: any): array
    expression.registerFunction('array', (input) => Array.isArray(input) ? input : Array.from(input))

    // $camelcase(input: string): string
    expression.registerFunction('camelcase', (...args) => camelcase(...args))

    // $concat(...input: (array | *)?): array
    expression.registerFunction('concat', (...args) => {
      return [].concat(...args)
    })

    // $unique(input: (array | *)?): array
    expression.registerFunction('unique', (input) => {
      if (Array.isArray(input)) {
        return Array.from(new Set(input))
      } else {
        return input
      }
    })

    // $slice(node: ParserNode, start: number, stop: number): Array
    expression.registerFunction('slice', (node, start, stop) => {
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
 * @public
 * @module query
 */
module.exports = {
  cache,
  query
}
