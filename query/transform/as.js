const primitives = {
  array: '$array',
  boolean: '$boolean',
  float: '$float',
  function: '$function',
  int: '$int',
  number: '$number',
  object: '$object',
  string: '$string'
}

const constants = {
  false: '$false',
  nan: '$NaN',
  null: '$null',
  true: '$true'
}

const instances = {
  date: '$date',
  document: '$document',
  fragment: '$fragment',
  node: '$node',
  text: '$text'
}

const specials = {
  any: '$eval',
  camelcase: '$camelcase',
  eval: '$eval',
  json: '$json',
  keys: '$keys',
  pascalcase: '$pascalcase',
  query: '$eval',
  reversed: '$reversed',
  snakecase: '$snakecase',
  sorted: '$sorted',
  tuple: '$tuple',
  unique: '$unique',
}

const REGEX = /(let\s*.*\s*=|;|\s)?(.*)\s*\bas\b\s*([a-z|A-Z|0-9|_|<|>]+)(.*)/g

function transform(queryString) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, prefix, subject, type, postfix) {
    if (subject) {
      subject = subject.replace(REGEX, replace)
    }

    return compile({ prefix, subject, type, postfix }).replace(REGEX, replace)
  }
}

function compile({ prefix, subject, type, postfix }) {
  const originalType = type
  const output = [prefix || '']
  let target = null

  type = type.split('<')[0]

  const isPrimitiveConversion = type.toLowerCase() in primitives
  const isConstantConversion = type.toLowerCase() in constants
  const isInstanceConversion = type.toLowerCase() in instances
  const isSpecialConversion = type.toLowerCase() in specials

  if (isPrimitiveConversion) {
    target = primitives
  } else if (isConstantConversion) {
    target = constants
  } else if (isInstanceConversion) {
    target = instances
  } else if (isSpecialConversion) {
    target = specials
  }

  if (target) {
    const [, innerType ] = (originalType.match(RegExp(`${type}<(.*)>`)) || [])
    if (/int|float|string|array/.test(type.toLowerCase())) {
      subject = subject
        .replace(/[(]+/g, '(')
        .replace(/[)]+/g, ')')
      output.push(`${target[type.toLowerCase()]}(${subject}, "${innerType || ''}")`)
    } else {
      output.push(`${target[type.toLowerCase()]}(${subject})`)
      if (postfix) {
        output.push(postfix)
      }
    }
  }

  if (!target) {
    throw Object.assign(new SyntaxError(`Cannot cast to unknown type: ${type}`), {
      token: type
    })
  }

  return output.join(' ')
}

module.exports = {
  transform
}
