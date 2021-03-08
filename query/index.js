const { normalizeValue } = require('../normalize')
const { ParserNode } = require('../parser')
const camelcase = require('camelcase')
const extendMap = require('map-extend')
const bindings = require('./bindings')
const defined = require('defined')
const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

/**
 * Converts a map to an object.
 * @private
 * @param {Map} map
 * @return {Object}
 */
function convertMapToObject(map, object) {
  return [ ...map ].reduce(reduce, object || {})

  function reduce(o, [k, v]) {
    return Object.assign(o, { [k]: v })
  }
}

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
 * An extended Map of imports with an abstract `load()` method.
 * @public
 * @abstract
 * @memberof query
 */
class Imports extends Map {

  /**
   * Creates a new `Imports` instance from a variety of input.
   * @public
   * @static
   * @param {...(Map|Imports|Object} ...entries
   * @return {Imports}
   */
  static from(...entries) {
    const maps = []
    let opts = null

    for (const entry of entries) {
      if (entry && 'object' === typeof entry) {
        if ('function' === typeof entry.load) {
          opts = entry
        }
      }

      if (entry && entry instanceof Map) {
        maps.push(entry)
      } else if (entry && 'object' === typeof entry && !Array.isArray(entry)) {
        const map = new Map()
        for (const key in entry) {
          map.set(key, entry[key])
        }
        maps.push(map)
      }
    }

    const imports = new this(opts)
    extendMap(imports, ...maps)
    return imports
  }

  /**
   * `Imports` class constructor.
   * @protected
   * @constructor
   * @param {Object} opts
   */
  constructor(opts) {
    opts = { ...opts }
    super()

    if ('function' === typeof opts.load) {
      this.load = opts.load
    }
  }

  /**
   * Imports loader function implementation
   * @public
   * @abstract
   * @param {String} target
   */
  async load(target) {
    debug('no-op load for: %s', target)
  }
}

/**
 * An extended Map of key-value assignments for global variables.
 * @public
 * @abstract
 * @memberof query
 */
class Assigments extends Map {

  /**
   * Creates a new `Assignments` instance from a variety of input.
   * @public
   * @static
   * @param {...(Map|Assignments|Object} ...entries
   * @return {Assignments}
   */
  static from(...entries) {
    const maps = []

    for (const entry of entries) {
      if (entry && entry instanceof Map) {
        maps.push(entry)
      } else if (entry && 'object' === typeof entry && !Array.isArray(entry)) {
        const map = new Map()
        for (const key in entry) {
          map.set(key, entry[key])
        }
        maps.push(map)
      }
    }

    const assigments = new this(opts)
    extendMap(assigments, ...maps)
    return assigments
  }
}

/**
 * Query context object that is a container for imports, global variables,
 * query target, and more.
 * @public
 * @memberof query
 */
class Context {

  /**
   * Creates a new `Context` instance from input.
   * @static
   * @return {Context}
   */
  static from(...args) {
    return new this(...args)
  }

  /**
   * `Context` class constructor.
   * @protected
   * @constructor
   * @param {Object} opts
   * @param {Map} opts.imports
   * @param {Map} opts.assignments
   * @param {?Function} opts.loader
   */
  constructor(opts) {
    if (!opts || 'object' !== typeof opts) {
      throw new TypeError('Context constructor needs options argument.')
    }

    this.node = opts.node
    this.target = opts.target
    this.imports = opts.imports instanceof Map ? opts.imports : new Imports()
    this.bindings = opts.bindings instanceof Bindings ? opts.bindings : Bindings.from(this, opts.bindings)
    this.assignments = opts.assignments instanceof Map ? opts.assignments : new Assigments()

    for (const [ key, value ] of this.assignments) {
      this.assign(key, value)
    }
  }

  /**
   * Assigns and normalizes a value for a given key in this context.
   * @param {String} key
   * @param {?Mixed} value
   * @return {?Mixed}
   */
  assign(key, value) {
    const assignments = convertMapToObject(this.assignments)
    const { target, node } = this

    // try to parse value if it is indeed valid JSON supporting a statement like:
    // let json = '{"hello": "world"}'
    if ('string' === typeof value || value instanceof String) {
      try {
        value = value.replace(/^'/, '"').replace(/'$/, '"')
        value = JSON.parse(value)
      } catch (err) {
        debug(err.stack || err)
      }
    }

    // interpolate variable values in key statement
    if ('string' === typeof key) {
      for (const k in assignments) {
        const regex = RegExp(`\\$${k}`, 'g')
        key = key.replace(regex, assignments[k])
      }
    }

    // try to evaluate JSONata expression in key statement
    try {
      key = Expression.from(this, key).evaluate() || key
    } catch (err) {
      debug(err.stack || err)
    }

    // try to evaluate JSONata expression in value statement
    try {
      value = Expression.from(this, value).evaluate() || value
    } catch (err) {
      debug(err.stack || err)
    }

    // interpolate variable values in value statement
    if ('string' === typeof value) {
      for (const k in assignments) {
        const regex = RegExp(`\\$${k}`, 'g')
        value = value.replace(regex, assignments[k])
      }
    }

    // normalize value before setting
    value = normalizeValue(value)

    this.assignments.set(key, value)
  }

  /**
   * Imports target calling context loader.
   * @public
   * @param {String} name
   * @return {Promise<Mixed>}
   */
  async import(name) {
    const assignments = convertMapToObject(this.assignments)
    const { target, node, imports } = this

    if ('string' === typeof name) {
      try {
        name = JSON.parse(name.replace(/^'/, '"').replace(/'$/, '"'))
      } catch (err) {
        debug(err.stack || err)
      }

      try {
        name = Expression.from(this, name).evaluate() || name
      } catch (err) {
        debug(err.stack || err)
      }
    }

    if (imports.has(name)) {
      return imports.get(name)
    }

    const work = { rejected: false, name }
    const promise = new Promise(resolver)

    Object.assign(promise, work)
    imports.set(name, promise)

    return promise.catch((err) => {
      debug(err.stack || err)
      imports.delete(name)
    })

    function resolver(resolve, reject) {
      Object.assign(work, {
        resolve: (...args) => resolve(...args),
        reject(err) {
          Object.assign(work, promise, { rejected: true });
          return reject(err)
        }
      })

      if (!work.rejected && 'function' === typeof imports.load) {
        imports.load(name).then(work.resolve, work.reject)
      } else {
        resolve()
      }
    }
  }
}

/**
 * Query expression container. Query transforms and bindings are applied here.
 * @public
 * @memberof query
 */
class Expression {

  /**
   * Creates a new `Expression` instance from input.
   * @static
   * @return {Expression}
   */
  static from(...args) {
    return new this(...args)
  }

  /**
   * `Expression` class constructor.
   * @protected
   * @constructor
   * @param {String} string
   * @param {?Object} opts
   * @param {?Array|Object} opts.bindings
   * @param {?Array<Object|Function>} opts.transforms
   */
  constructor(context, string, opts) {
    if ('string' !== typeof string) {
      throw new TypeError('Expression constructor needs options argument.')
    }

    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    this.transforms = new Transforms(context, opts.transforms)
    this.bindings = null
    this.context = context
    this.string = string
    this.result = opts.result || null
    this.value = cache.get(string) || null

    if (context.bindings instanceof Bindings) {
      this.bindings = context.bindings
    } else {
      this.bindings = Bindings.from(context, opts.bindings)
    }
  }

  get node() {
    return this.context.node
  }

  get target() {
    return this.context.target
  }

  /**
   * A map of all import paths to their promise for resolution known for or
   * requested by this expression query or injected externally.
   * @public
   * @accessor
   * @type {?Map}
   */
  get imports() {
    return this.context.imports || null
  }

  /**
   * A map of all global key-value assignments known for or set by this
   * expression query or injected externally.
   * @public
   * @accessor
   * @type {?Map}
   */
  get assignments() {
    return this.context.assignments || null
  }

  /**
   * Resets processed expression value.
   * @public
   */
  reset() {
    this.value = null
    this.result = null
  }

  processImports() {
    this.transforms.process(0, this.string)
    return this.imports
  }

  process() {
    const { bindings, string } = this
    const transformed = this.transforms.transform(string)

    if (transformed) {
      this.value = jsonata(transformed)

      for (const key of bindings.keys()) {
        const { fn, signature } = bindings.get(key)
        this.value.registerFunction(key, fn, signature)
      }

      cache.set(string, this.value)
      return this.value
    }

    return null
  }

  evaluate() {
    if (!this.value) {
      this.process()
    }

    if (this.value) {
      const assignments = convertMapToObject(this.assignments)
      this.result = this.value.evaluate(this.target, assignments)
    }

    if (this.result && 'object' === typeof this.result && 'sequence' in this.result) {
      delete this.result.sequence
    }

    return this.result
  }
}

/**
 * Query transform container to apply many transforms to an input.
 * @public
 * @memberof query
 */
class Transforms {

  /**
   * Creates a new `Transforms` instance from input.
   * @static
   * @return {Transforms}
   */
  static from(...args) {
    return new this(...args)
  }

  /**
   * `Transforms` class constructor.
   * @protected
   * @constructor
   * @param {Context} context
   * @param {...(Function|Array<Function>|Object)} ...transforms
   */
  constructor(context, ...transforms) {
    this.context = context
    this.phases = []

    this.push(0, require('./transform/prepare'))
    this.push(0, require('./transform/comments'))
    this.push(0, require('./transform/symbols'))
    this.push(0, require('./transform/as'))
    this.push(0, require('./transform/is'))
    this.push(0, require('./transform/let'))
    this.push(0, require('./transform/typeof'))
    this.push(0, require('./transform/contains'))
    this.push(0, require('./transform/print'))
    this.push(0, require('./transform/import'))
    this.push(0, require('./transform/hex'))
    this.push(0, require('./transform/cleanup'))

    this.push(1, require('./transform/children'))
    this.push(1, require('./transform/attributes'))
    this.push(1, require('./transform/ordinals'))
    this.push(1, require('./transform/cleanup'))

    for (const transform of transforms) {
      if ('function' === typeof transform) {
        this.push(2, transform)
      } else if (transform && 'function' === typeof transform.transform) {
        this.push(2, transform.transform)
      } else if (Array.isArray(transform)) {
        for (const t of transform) {
          if ('function' === typeof t) {
            this.push(2, transform)
          } else if (t && 'function' === typeof t.transform) {
            this.push(2, t.transform)
          }
        }
      }
    }

    this.push(2, require('./transform/comments'))
    this.push(2, require('./transform/cleanup'))
  }

  /**
   * Push a transform into an priority phase.
   * @param {?Number} [priority = 2]
   * @param {Function}
   */
  push(priority, entry) {
    if ('number' !== typeof priority) {
      entry = priority
      priority = 2
    }

    const phase = this.phases[priority] || []

    if (!this.phases[priority]) {
      this.phases[priority] = phase
    }

    if (entry) {
      if ('function' === typeof entry) {
        return phase.push(entry)
      } else if ('function' === typeof entry.transform) {
        return phase.push(entry.transform)
      }
    }

    return 0
  }

  /**
   * Process input at specified transform phase.
   * @param {Number} priority
   * @param {String} input
   * @return {String}
   */
  process(priority, input) {
    const { context } = this
    const transforms = this
    const phase = this.phases[priority] || []

    debug('before transform (phase=%d)', priority, input)
    const output = phase.reduce(reduce, input)
    debug('after transform (phase=%d)', priority, output)

    return output

    function reduce(output, transform) {
      return transform(output, context, transforms, phase)
    }
  }

  transform(input, phases) {
    phases = Array.isArray(phases) ? phases : [0, 1, 2]

    if ('string' !== typeof input) {
      return ''
    }

    for (const phase of phases) {
      input = this.process(phase, input)
    }

    return input.trim()
  }
}

/**
 * Query bindings container
 * @public
 * @memberof query
 */
class Bindings {

  /**
   * Creates a new `Bindings` instance from input.
   * @public
   * @static
   * @return {Bindings}
   */
  static from(input, ...args) {
    if (input instanceof this) {
      const bindings = new this(input.context, input.entries)
      const tmp = new this(...args)
      extendMap(bindings.entries, tmp.entries)
      return bindings
    }

    return new this(input, ...args)
  }

  /**
   * The default built in bindings.
   * @public
   * @static
   * @accessor
   * @type {Object}
   */
  static get builtins() {
    return bindings
  }

  /**
   * `Bindings` class constructor.
   * @protected
   * @constructor
   * @param {Context} context
   * @param {...(Object|Map|Array<Object|Map>)} ...entries
   */
  constructor(context, ...entries) {
    this.context = context
    this.entries = new Map()

    entries.push(Bindings.builtins)

    for (const entry of entries) {
      if (entry instanceof Map) {
        extendMap(this.entries, entry)
      } else if (Array.isArray(entry)) {
        for (const value of entry) {
          if (value instanceof Map) {
            extendMap(this.entries, value)
          } else if (value && 'object' === typeof value) {
            for (const key in value) {
              this.entries.set(key, value)
            }
          }
        }
      } else if (entry && 'object' === typeof entry) {
        for (const key in entry) {
          this.entries.set(key, entry[key])
        }
      }
    }
  }

  /**
   * Returns binding keys.
   * @public
   * @return {Array<String>}
   */
  keys() {
    return this.entries.keys()
  }

  /**
   * Queries for binding by name. If binding is a function, a bound
   * wrapped function is returned that calls the function.
   * @public
   * @param {String} name
   * @return {?Function}
   */
  get(name) {
    const { entries } = this
    const value = entries.get(name) || null

    if ('function' === typeof value) {
      const { description = null, signature = '<x-:x>' } = value
      const fn = Object.assign(new Function('fn', `
        return function ${value.name || 'binding'}(...args) { return fn(...args) }
      `)(value), { signature, description })

      return { fn, signature, description }
    }

    return value
  }
}

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

  if (!opts.model) {
    visit(model, node)
  }

  const target = model[node.originalName] || model[node.name] || model
  const context = Context.from({
    target, node, ...opts,
    bindings: [
      opts.bindings,
      node && node.options && node.options.bindings
    ].filter(Boolean)
  })

  const expression = Expression.from(context, queryString, opts)
  const imports = expression.processImports()

  if (imports.size) {
    return new Promise(async (resolve, reject) => {
      try {
        await Promise.all(expression.imports.values())
        const result = expression.evaluate()

        if (Array.isArray(result)) {
          return resolve(Node.createFragment(null, {
            children: result
          }))
        }

        return resolve(result || null)
      } catch (err) {
        reject(err)
      }
    })
  }

  const result = expression.evaluate()

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
  Assigments,
  Bindings,
  cache,
  Context,
  Expression,
  Imports,
  Transforms,
  query
}
