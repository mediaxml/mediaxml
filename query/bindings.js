const { normalizeValue } = require('../normalize')
const { Text } = require('../text')

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

  const parts = signature.split(/[#|/]+/)
  signature = parts[0].trim()
  description = (parts[1] || '').trim()

  return Object.assign(bound, { signature, description })
}

module.exports = {
  binding,

  // $null(input: any): null
  null: binding(
    '<j-:l> # Returns null.',
    function $null() {
      return null
    }),

  // $typeof(input: any): string
  typeof: binding(
    '<j-:s> # Returns input type as a string.',
    function $typeof (input) {
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
  classConstructorName: binding(
    '<j-:s> # Returns the class constructor name (if applicable) as a string.',
    function $classConstructorName(input) {
      return (input && input.constructor && input.constructor.name) || ''
    }),

  // $print(...input: any)
  print: binding(
    '<j-:l> # Prints variable input to stdout.',
    function $print(...input) {
      return console.log(...input)
    }),

  // $isNaN(input: any): boolean
  isNaN: binding(
    '<j-:b> # Returns true if input is a NaN (not a number), otherwise false.',
    function $isNaN(input) {
      return Number.isNaN(input)
    }),

  // $isArray(input: any): boolean
  isArray: binding(
    '<j-:b> # Returns true if input is an array, otherwise false.',
    function $isArray(input) {
      return Array.isArray(input)
    }),

  // $isObject(input: any): boolean
  isObject: binding(
    '<j-:b> # Returns true if input is an object, otherwise false.',
    function $isObject(input) {
      return null !== input && 'object' === typeof input
    }),

  // $isString(input: any): boolean
  isString: binding(
    '<j-:b> # Returns true if input is a string, otherwise false.',
    function $isString(input) {
      return input instanceof String || 'string' === typeof input
    }),

  // $isNumber(input: any): boolean
  isNumber: binding(
    '<j-:b> # Returns true if input is a number, otherwise false.',
    function $isNumber(input) {
      return input instanceof Number || 'number' === typeof input
    }),

  // $isBoolean(input: any): boolean
  isBoolean: binding(
    '<j-:b> # Returns true if input is a boolean, otherwise false.',
    function $isBoolean(input) {
      return input instanceof Boolean || 'boolean' === typeof input
    }),

  // $json(): (object | array | string | number | boolean)?
  json: binding(
    '<j-j?:j> # Converts input into a plain JSON object (parsed).',
    function $json(input, arg) {
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
  number: binding(
    '<j-:n> # Converts input into a number.',
    function $number(input) {
      return +normalizeValue(input)
    }),

  // $tuple(): int
  tuple: binding(
    '<j-:o> # Converts input into a "tuple".',
    function $tuple(input) {
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
  now: binding(
    '<j-:n> # Returns the UNIX Epoch in milliseconds.',
    function $now(input) {
      return Date.now()
    }),

  // $length(input: any): int
  length: binding(
    '<j-:n> # Returns the length of input (string | array | ...).',
    function $length(input) {
      if (input && input.length) {
        return input.length || 0
      } else if (!input) {
        return 0
      } else {
        return String(input).length
      }
    }),

  // $keys(input: any): array
  keys: binding(
    '<j-:a> # Returns computed keys of input as an array.',
    function $keys(input) {
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
  int: binding(
    '<j-j?:n> # Converts input into an integer.',
    function $int(input, arg) {
      if (Array.isArray(input)) {
        return input.map((i) => parseInt(+normalizeValue(String(i)), arg))
      } else {
        return parseInt(+normalizeValue(String(input)), arg)
      }
    }),

  // $float(input: any): float
  float: binding(
    '<j-j?:n> # Converts input into a float.',
    function $float(input, arg) {
      if (Array.isArray(input)) {
        return input.map((i) => parseFloat(+normalizeValue(String(i)), arg))
      } else {
        return parseFloat(+normalizeValue(String(input)), arg)
      }
    }),

  // $true(input: any): true
  true: binding(
    '<j-:b> # Returns true for any input.',
    function $true(input) {
      if (Array.isArray(input)) {
        return input.map((i) => true)
      } else {
        return true
      }
    }),

  // $false(input: any): false
  false: binding(
    '<j-:b> # Returns false for any input.',
    function $false(input) {
      if (Array.isArray(input)) {
        return input.map((i) => false)
      } else {
        return false
      }
    }),

  // $boolean(input: any): boolean
  boolean: binding(
    '<j-:b> # Converts input into a boolean.',
    function $boolean(input) {
      if (Array.isArray(input)) {
        return input.map((i) => Boolean(i))
      } else {
        return Boolean(input)
      }
    }),

  // $string(input: any): string
  string: binding(
    '<j-j?:s> # Converts input into a string.',
    function $string(input, arg) {
      if (Array.isArray(input)) {
        return input.map((i) => i && i.toString ? i.toString(arg) : String(i))
      } else if (input) {
        return input.toString ? input.toString(arg) : String(input)
      } else {
        return ''
      }
    }),

  // $array(input: any): array
  array: binding(
    '<j-:a> # Converts input into an array.',
    function $array(input) {
      if (Array.isArray(input)) {
        return input
      }

      if (input && length in input) {
        return Array.from(input)
      }

      if (undefined !== input) {
        return [input]
      }

      return []
    }),

  // $date(input: any): Date
  date: binding(
    '<j-:o> # Converts input into a date.',
    function $date(input) {
      if (Array.isArray(input)) {
        return input.map(parse)
      } else {
        return parse(input)
      }

      function parse(value) {
        const parsed = normalizeValue(value)

        if (parsed instanceof Date) {
          return parsed
        }

        return new Date(NaN)
      }
    }),

  // $camelcase(input: string): string
  camelcase: binding(
    '<s-:s> # Converts input string to camelcase.',
    function $camelcase(...args) {
      return camelcase(...args)
    }),

  // $concat(...input: (array | *)?): array
  concat: binding(
    '<a<j->:a> # Returns concatenated variable input as an array.',
    function $concat(...args) {
      return [].concat(...args)
    }),

  // $unique(input: (array | *)?): array
  unique: binding(
    '<j-:a> # Returns input array with only unique elements.',
    function $unique(input) {
      if (Array.isArray(input)) {
        return Array.from(new Set(input))
      } else if ('string' === typeof input) {
        return $unique(input.split(''))
      } else if (undefined !== input) {
        return [input]
      } else {
        return []
      }
    }),

  // $slice(node: (ParserNode | Array), start: number, stop: number): Array
  slice: binding(
    '<j-:a> # Returns a slice of an array or parser node.',
    function $slice(node, start, stop) {
      if (node && node.children) {
        return node.children.slice(start, stop)
      } else if (node.slice) {
        return node.slice(start, stop)
      } else {
        return node
      }
    }),

  join: binding(
    '<a-s?:s> # Returns an array joined by a given delimiter (default: ",").',
    function $join(array, delimiter) {
      return Array.from(array).join(delimiter || ',')
    }),

  text: binding(
    '<j-:j> # Returns input as a text node',
    function $text(input) {
      return Text.from(String(input || ''))
    }),
}
