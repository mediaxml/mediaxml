const { normalizeValue, } = require('../normalize')

function binding(signature, fn) {
  if ('function' === typeof signature) {
    fn = signature
    signature = '<x-:x>'
  }

  if ('function' !== typeof fn) {
    fn = () => void 0
  }

  return Object.assign(bound, { signature })

  function bound(...args) {
    try {
      const result = fn(...args)

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
  }
}

module.exports = {
  binding,

  // $null(input: any): null
  null: binding('<j-:l>', () => null),

  // $typeof(input: any): string
  typeof: binding('<j-:s>', (input) => {
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
  classConstructorName: binding('<j-:s>', (input) => {
    return (input && input.constructor && input.constructor.name) || ''
  }),

  // $print(...input: any)
  print: binding('<j-:l>', (...input) => {
    return console.log(...input)
  }),

  // $isArray(input: any): boolean
  isArray: binding('<j-:b>', (input) => {
    return Array.isArray(input)
  }),

  // $json(): (object | array | string | number | boolean)?
  json: binding('<j-j?:j>', function toJSON(input, arg) {
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
        input = input.toJSON ? input.toJSON(arg) : input
        return JSON.parse(JSON.stringify(input))
      }
    } else {
      return null
    }
  }),

  // $number(): int
  number: binding('<j-:n>', (input) => {
    return Number(input)
  }),

  // $tuple(): int
  tuple: binding('<j-:o>', (input) => {
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
  now: binding('<j-:n>', (input) => Date.now()),

  // $length(input: any): int
  length: binding('<j-:n>', (input) => {
    if (input && input.length) {
      return input.length
    } else if (!input) {
      return 0
    } else {
      return String(input).length
    }
  }),

  // $keys(input: any): array
  keys: binding('<j-:a>', (input) => {
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
  int: binding('<j-j?:n>', (input, arg) => {
    if (Array.isArray(input)) {
      return input.map((i) => parseInt(+normalizeValue(String(i)), arg))
    } else {
      return parseInt(+normalizeValue(String(input)), arg)
    }
  }),

  // $float(input: any): float
  float: binding('<j-j?:n>', (input, arg) => {
    if (Array.isArray(input)) {
      return input.map((i) => parseFloat(+normalizeValue(String(i)), arg))
    } else {
      return parseFloat(+normalizeValue(String(input)), arg)
    }
  }),

  // $true(input: any): true
  true: binding('<j-:b>', (input) => {
    if (Array.isArray(input)) {
      return input.map((i) => true)
    } else {
      return true
    }
  }),

  // $false(input: any): false
  false: binding('<j-:b>', (input) => {
    if (Array.isArray(input)) {
      return input.map((i) => false)
    } else {
      return false
    }
  }),

  // $boolean(input: any): boolean
  boolean: binding('<j-:b>', (input) => {
    if (Array.isArray(input)) {
      return input.map((i) => Boolean(i))
    } else {
      return Boolean(input)
    }
  }),

  // $string(input: any): string
  string: binding('<j-j?:s>', (input, arg) => {
    if (Array.isArray(input)) {
      return input.map((i) => i && i.toString ? i.toString(arg) : String(i))
    } else if (input) {
      return input.toString ? input.toString(arg) : String(input)
    } else {
      return ''
    }
  }),

  // $array(input: any): array
  array: binding('<j-:a>', (input) => {
    return Array.isArray(input) ? input : [ ...[input] ].filter((i) => i !== undefined)
  }),

  // $date(input: any): Date
  date: binding('<j-:o>', (input) => {
    if (Array.isArray(input)) {
      return input.map((i) => new Date(i))
    } else {
      return new Date(input)
    }
  }),

  // $camelcase(input: string): string
  camelcase: binding('<s-:s>', (...args) => camelcase(...args)),

  // $concat(...input: (array | *)?): array
  concat: binding('<a<j->:a>', (...args) => {
    return [].concat(...args)
  }),

  // $unique(input: (array | *)?): array
  unique: binding('<j-:a>', (input) => {
    if (Array.isArray(input)) {
      return Array.from(new Set(input))
    } else {
      return input
    }
  }),

  // $slice(node: ParserNode, start: number, stop: number): Array
  slice: binding('<j-:a>', (node, start, stop) => {
    if (node && node.children) {
      return node.children.slice(start, stop)
    } else if (node.slice) {
      return node.slice(start, stop)
    } else {
      return node
    }
  }),

  join: binding('<a-s?:s>', (array, delimiter) => {
    return Array.from(array).join(delimiter || ',')
  })
}
