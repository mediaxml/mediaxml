const { normalizeValue } = require('../normalize')
const { Document, Node } = require('../document')
const { Fragment } = require('../fragment')
const toSnakeCase = require('to-snake-case')
const camelcase = require('camelcase')
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
      if ('string' === typeof input || input instanceof String) {
        try {
          return JSON.parse(input)
        } catch (err) {
          let [ , position ] = (err.message.match(/position\s+([0-9]+)/) || [])
          const slice = input.slice(parseInt(position))
          throw new SyntaxError(`${err.message}: \`${slice.slice(0, 8)} ...\``)
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
          const keys = [ ...input.keys() ]
          const values = [ ...input.values() ]
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
      if (Array.isArray(input)) {
        return input.map(keys)
      } else if (input) {
        return keys(input)
      } else {
        return []
      }

      function keys(input) {
        if (input && 'function' === typeof input.keys) {
          return [ ...input.keys() ]
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

  // $NaN(input: any): false
  NaN: binding(
    '<j-:n> # Returns NaN for any input.',
    function $NaN(input) {
      if (Array.isArray(input)) {
        return input.map(() => Number.NaN)
      } else {
        return Number.NaN
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

  // $object(input: any): object
  object: binding(
    '<j-:j> # Converts input into an object.',
    function $object(input) {
      if (Array.isArray(input)) {
        return input.map((i) => Object(i))
      } else {
        return Object(input)
      }
    }),

  // $function(input: any): function
  function: binding(
    '<j-:f> # Converts input into a function.',
    function $function(input) {
      if (Array.isArray(input)) {
        return input.map((i) => Function(String(i || '')))
      } else {
        return Function(String(input || ''))
      }
    }),

  // $string(input: any): string
  string: binding(
    '<j-j?:s> # Converts input into a string.',
    function $string(input, arg) {
      if (Array.isArray(input)) {
        return input.map(toString)
      } else if (input) {
        return toString(input)
      } else {
        return ''
      }

      function toString(i) {
        if (i && 'object' === typeof i && 'hasOwnProperty' in i && i.hasOwnProperty('toString')) {
          return i.toString(arg)
        } else if (i && 'Object' === i.constructor.name) {
          return JSON.stringify(i)
        } else {
          return String(i)
        }
      }
    }),

  // $array(input: any): array
  array: binding(
    '<j-s?:a> # Converts input into an array.',
    function $array(input, valueType) {
      if (Array.isArray(input)) {
        return input.map((value) => {
          if (!valueType) {
            return value
          }

          switch (valueType.toLowerCase()) {
            case 'json': return JSON.parse(value)
            case 'number': return Number(value)
            case 'int': return parseInt(value)
            case 'float': return parseFloat(value)
            case 'string': return String(value)
            case 'object': return Object(value)
            case 'boolean': return !!value
            case 'array': return $array(value)
            default: return value
          }
        })
      }

      if (input && input.length) {
        return $array(Array.from(input), valueType)
      }

      if (undefined !== input) {
        return $array([input], valueType)
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

  // $pascalcase(input: string): string
  pascalcase: binding(
    '<s-:s> # Converts input string to pascalcase.',
    function $pascalcase(input) {
      return camelcase(input, { pascalCase: true })
    }),

  // $snakecase(input: string): string
  snakecase: binding(
    '<s-:s> # Converts input string to snakecase.',
    function $snakecase(input) {
      return toSnakeCase(input)
    }),

  // $concat(...input: (array | *)?): array
  concat: binding(
    '<x+> # Returns concatenated variable input as an array.',
    function $concat(...args) {
      return [].concat(...args)
    }),

  // $unique(input: (array | *)?): array | string
  unique: binding(
    '<j-:(as)> # Returns input array with only unique elements.',
    function $unique(input) {
      if (Array.isArray(input)) {
        const results = []
        const seen = []
        for (const i of input) {
          const v = i instanceof String ? String(i) : i
          if (!seen.includes(v)) {
            results.push(i)
            seen.push(v)
          }
        }

        return results
      } else if (input instanceof String || 'string' === typeof input) {
        return $unique(input.split('')).join('')
      } else if (undefined !== input) {
        return [input]
      } else {
        return []
      }
    }),

  // $sorted(input: (array | *)?): array | string
  sorted: binding(
    '<j-:(as)> # Returns input array with elements sorted.',
    function $sorted(input, arg) {
      if (Array.isArray(input)) {
        return input.sort(sort)
      } else if ('string' === typeof input || input instanceof String) {
        return $sorted(input.split('')).join('')
      } else if (undefined !== input) {
        return [input]
      } else {
        return []
      }

      function sort(left, right) {
        if (left instanceof String) {
          left = String(left)
        }

        if (right instanceof String) {
          right = String(right)
        }

        const sorted = [left, right].sort()

        if (left === right) {
          return 0
        } else if (left === sorted[0]) {
          return -1
        } else {
          return 1
        }
      }
    }),

  // $reversed(input: (array | *)?): array | string
  reversed: binding(
    '<j-:(as)> # Returns input array or string with elements reversed.',
    function $reversed(input) {
      if (Array.isArray(input)) {
        return input.reverse()
      } else if ('string' === typeof input || input instanceof String) {
        return $reversed(input.split('')).join('')
      } else if (undefined !== input) {
        return [input]
      } else {
        return []
      }
    }),

  // $slice(node: (ParserNode | Array), start: number, stop: number): array | string
  slice: binding(
    '<j-n?n?:(sa)> # Returns a slice of an array, string, or parser node.',
    function $slice(node, start, stop) {
      if ('number' !== typeof start) {
        start = 0
      }

      if (
        node &&
        node.children &&
        'function' === typeof node.children.slice
      ) {
        if ('number' !== typeof stop) {
          stop = node.children.length
        }

        return node.children.slice(start, stop)
      } else if (node && node.slice && 'function' === typeof node.slice) {
        if ('number' !== typeof stop) {
          if ('number' == typeof node.length) {
            stop = node.length
          } else {
            stop = Infinity
          }
        }

        if ('string' === typeof node || node instanceof String) {
          return node.slice(start, stop)
        } else {
          return node.slice(start, stop)
        }
      } else {
        return node
      }
    }),

  // $join(array: array, delimiter: string): string
  join: binding(
    '<a-s?:s> # Returns an array (or string) joined by a given delimiter (default: ",").',
    function $join(array, delimiter) {
      return Array.from(array).join(delimiter || ',')
    }),

  // $has(input: any, key: string): boolean
  has: binding(
    '<j-s-:b> # Returns true if key is in target.',
    function $has(target, key) {
      if ('boolean' === typeof target) {
        return false
      }

      if (null === target || undefined === target) {
        return false
      }

      if ('number' === typeof target) {
        return false
      }


      return Object.prototype.hasOwnProperty.call(target, key)
    }
  ),

  // $contains(input: any, search: string): boolean
  contains: binding(
    '<j-s-:b> # Returns true if search key is in input target.',
    function $contains(target, search) {
      if ('boolean' === typeof target) {
        return false
      }

      if (null === target || undefined === target) {
        return false
      }

      if ('number' === typeof target) {
        return false
      }

      if ('string' === typeof target || target instanceof String) {
        target = String(target)
        return target.includes(search)
      }

      if (Array.isArray(target) || 'function' === typeof target.includes) {
        return target.includes(normalizeValue(search)) || search in target
      }

      if ('object' === typeof target) {
        return search in target
      }

      return false
    }
  ),

  // $text(input: (string | any): Text
  text: binding(
    '<j-:j> # Returns input as a text node.',
    function $text(input) {
      return Text.from(String(input || ''))
    }),

  // $document(input: (string | any): Document
  document: binding(
    '<j-:j> # Returns input as a document.',
    function $document(input) {
      return Document.from(input)
    }),

  // $node(input: (string | any): Document
  node: binding(
    '<j-:j> # Returns input as a document node.',
    function $node(input) {
      return Node.from(input)
    }),

  // $fragment(input: (string | any): Document
  fragment: binding(
    '<j-:j> # Returns input as a document fragment.',
    function $node(input) {
      return Fragment.from(input)
    }),

  // $noop()
  noop: binding(
    '<:> # No operation function.',
    function $noop() {
    }),
}
