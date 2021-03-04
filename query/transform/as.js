const REGEX = /((?![\(|\[|\{]$)(?!\s$)(.*))?\s*?(\:)?\bas\b(\s*|(\s*?\(\s*?))([a-z|A-Z|0-9]+)(\s*?\))?/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, __, prefix, selector, ___, ____, type, postfix) {
    selector = (selector || '').trim()

    if (!selector && /:$/.test(prefix.trim())) {
      prefix = prefix.slice(0, -1)
    }

    prefix = (prefix || '').trim().replace(REGEX, replace)

    const primitives = {
      array: '$array',
      boolean: '$boolean',
      float: '$float',
      function: '$function',
      int: '$int',
      json: '$json',
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
      camelcase: '$camelcase',
      keys: '$keys',
      tuple: '$tuple',
      unique: '$unique',
      sorted: '$sorted'
    }

    const output = [prefix]
    let target = null

    const isPrimitiveConversion = type.toLowerCase() in primitives
    const isConstantConversion = type.toLowerCase() in constants
    const isInstanceConversion = type.toLowerCase() in instances
    const isSpecialConversion = type.toLowerCase() in specials

    output.splice(0, 1)

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
      output.push(`${target[type.toLowerCase()]}(${prefix})`)
    }

    if (postfix) {
      output.push(postfix)
    }

    return output.join(' ').replace(REGEX, replace)
  }
}

module.exports = {
  transform
}
