const { normalizeValue, } = require('../normalize')

function binding(signature, fn) {
  if ('function' === typeof signature) {
    fn = signature
    signature = '<x-:x>'
  }

  if ('function' !== typeof fn) {
    fn = () => void 0
  }

  const bound = new Function('fn', `return function ${fn.name || '$bound'}(...args) {
    let result = null

    try {
      result = fn(...args)

      if (args[0] instanceof Promise) {
        return args[0].then(() => Promise.resolve(result))
      }
    } catch (err) {
      if (args[0] instanceof Promise) {
        return Promise.reject(err)
      }

      throw err
    }

    return result
  }`)(fn)

  return Object.assign(bound, { signature })
}

module.exports = {
  binding,

  // $null(input: any): null
  null: binding('<j-:l>', function $null() { return null }),

  // $typeof(input: any): string
  typeof: binding('<j-:s>', function $typeof (input) {
    if ('string' === typeof input || input instanceof String) {
      return 'string'
    } else if (Array.isArray(input)) {
      return 'array'
    } else if ('number' === typeof input || input instanceof Number) {
      return 'number'
    } else if (input instanceof Date) {
      return 'date'
    }

    return typeof input
  }),

  // $classConstructorName(input: any): string
  classConstructorName: binding('<j-:s>', function $classConstructorName(input) {
    return (input && input.constructor && input.constructor.name) || ''
  }),

  // $print(...input: any)
  print: binding('<j-:l>', function $print(...input) {
    return console.log(...input)
  }),

  // $isArray(input: any): boolean
  isArray: binding('<j-:b>', function $isArray(input) {
    return Array.isArray(input)
  }),

  // $isObject(input: any): boolean
  isObject: binding('<j-:b>', function $isObject(input) {
    return null !== input && 'object' === typeof input
  }),

  // $isString(input: any): boolean
  isString: binding('<j-:b>', function $isString(input) {
    return input instanceof String || 'string' === typeof input
  }),

  // $isNumber(input: any): boolean
  isNumber: binding('<j-:b>', function $isNumber(input) {
    return input instanceof Number || 'number' === typeof input
  }),

  // $isBoolean(input: any): boolean
  isBoolean: binding('<j-:b>', function $isBoolean(input) {
    return input instanceof Boolean || 'boolean' === typeof input
  }),

  // $json(): (object | array | string | number | boolean)?
  json: binding('<j-j?:j>', function $json(input, arg) {
    if ('string' === typeof input) {
      try {
        return JSON.parse(input)
      } catch (err) {
        return input
      }
    } else if (input && 'function' !== typeof input) {
      if (Array.isArray(input)) {
        return input.map($json)
      } else {
        input = input.toJSON ? input.toJSON(arg) : input
        return JSON.parse(JSON.stringify(input))
      }
    } else {
      return null
    }
  }),

  // $number(): int
  number: binding('<j-:n>', function $number(input) {
    return Number(input)
  }),

  // $tuple(): int
  tuple: binding('<j-:o>', function $tuple(input) {
    if (input) {
      if ('function' === typeof input.keys && 'function' === typeof input.values) {
        const keys = input.keys()
        const values = input.values()
        const result = []

        for (let i = 0; i < keys.length; ++i) {
          result.push({key: keys[i], value: values[i]})
        }

        return result
      } else if (Array.isArray(input)) {
        return input
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
  }),

  // $now(): int
  now: binding('<j-:n>', function $now(input) {
    return Date.now()
  }),

  // $length(input: any): int
  length: binding('<j-:n>', function $length(input) {
    if (input && input.length) {
      return input.length
    } else if (!input) {
      return 0
    } else {
      return String(input).length
    }
  }),

  // $keys(input: any): array
  keys: binding('<j-:a>', function $keys(input) {
    if (Array.isArray(keys)) {
      return keys.map(keys)
    } else if (input) {
      return keys(input)
    } else {
      return []
    }

    function keys(input) {
      if (input && 'function' === typeof input.keys) {
        return input.keys()
      } else {
        return Object.keys(input)
      }
    }
  }),

  // $int(input: any): int
  int: binding('<j-j?:n>', function $int(input, arg) {
    if (Array.isArray(input)) {
      return input.map((i) => parseInt(+normalizeValue(String(i)), arg))
    } else {
      return parseInt(+normalizeValue(String(input)), arg)
    }
  }),

  // $float(input: any): float
  float: binding('<j-j?:n>', function $float(input, arg) {
    if (Array.isArray(input)) {
      return input.map((i) => parseFloat(+normalizeValue(String(i)), arg))
    } else {
      return parseFloat(+normalizeValue(String(input)), arg)
    }
  }),

  // $true(input: any): true
  true: binding('<j-:b>', function $true(input) {
    if (Array.isArray(input)) {
      return input.map((i) => true)
    } else {
      return true
    }
  }),

  // $false(input: any): false
  false: binding('<j-:b>', function $false(input) {
    if (Array.isArray(input)) {
      return input.map((i) => false)
    } else {
      return false
    }
  }),

  // $boolean(input: any): boolean
  boolean: binding('<j-:b>', function $boolean(input) {
    if (Array.isArray(input)) {
      return input.map((i) => Boolean(i))
    } else {
      return Boolean(input)
    }
  }),

  // $string(input: any): string
  string: binding('<j-j?:s>', function $string(input, arg) {
    if (Array.isArray(input)) {
      return input.map((i) => i && i.toString ? i.toString(arg) : String(i))
    } else if (input) {
      return input.toString ? input.toString(arg) : String(input)
    } else {
      return ''
    }
  }),

  // $array(input: any): array
  array: binding('<j-:a>', function $array(input) {
    return Array.isArray(input) ? input : [ ...[input] ].filter((i) => i !== undefined)
  }),

  // $date(input: any): Date
  date: binding('<j-:o>', function $date(input) {
    if (Array.isArray(input)) {
      return input.map((i) => new Date(i))
    } else {
      return new Date(input)
    }
  }),

  // $camelcase(input: string): string
  camelcase: binding('<s-:s>', function $camelcase(...args) {
    return camelcase(...args)
  }),

  // $concat(...input: (array | *)?): array
  concat: binding('<a<j->:a>', function $concat(...args) {
    return [].concat(...args)
  }),

  // $unique(input: (array | *)?): array
  unique: binding('<j-:a>', function $unique(input) {
    if (Array.isArray(input)) {
      return Array.from(new Set(input))
    } else {
      return input
    }
  }),

  // $slice(node: ParserNode, start: number, stop: number): Array
  slice: binding('<j-:a>', function $slice(node, start, stop) {
    if (node && node.children) {
      return node.children.slice(start, stop)
    } else if (node.slice) {
      return node.slice(start, stop)
    } else {
      return node
    }
  }),

  join: binding('<a-s?:s>', function $join(array, delimiter) {
    return Array.from(array).join(delimiter || ',')
  })
}
