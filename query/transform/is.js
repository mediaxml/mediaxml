const camelcase = require('camelcase')

const REGEX = /((?!\s$)?[\(|\)|\[|\]|\}|\$|\.|`|'|"|0-9|a-z|A-Z]+)?\s*?(\:)?is(\s*not\s*)?\s*?\(?\s*?(["|']?[a-z|A-Z|0-9]+["|']?)\s*?\)?/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, selector, not, type) {
    return compile({ prefix, selector, not, type }).replace(REGEX, replace)
  }
}

function compile({ prefix, selector, not, type }) {
  selector = (selector || '').trim()
  prefix = (prefix || '').trim()
  not = (not || '').trim()

  const primitives = ['string', 'array' ,'number', 'boolean', 'function', 'object', 'function']
  const instances = { date: 'Date', document: 'Document' }
  const constants = ['null', 'true', 'false', 'nan', 'infinity']
  const specials = { text: 'isText', node: 'isParserNode', fragment: 'isFragment' }
  const negate = 'not' === not.trim()
  const expr = [not, type].join(' ').trim().toLowerCase()

  const hasLeadingKeyword = /and|or|\./.test(prefix)
  const isPrimitiveCheck = primitives.includes(type.toLowerCase())
  const isConstantCheck = constants.includes(type.toLowerCase())
  const isInstanceCheck = type.toLowerCase() in instances
  const isSpecialCheck = type.toLowerCase() in specials
  const isStringCheck = (/^"/.test(type) && /"$/.test(type)) || (/^'/.test(type) && /'$/.test(type))
  const isNumberCheck = /^[0-9]+$/.test(type)

  const output = [prefix]

  let isInputStreamed = false

  if (
    !hasLeadingKeyword &&
    (!isConstantCheck && !isNumberCheck && !isStringCheck) ||
    'nan' === type.toLowerCase()
  ) {
    if (selector && '.' !== prefix.slice(-1)) {
      output.push('.')
    } else if (/[\)|\]|\}|\$|\.|`]/.test(prefix.slice(-1))) {
      output.push('.')
    } else if (/['|"]/.test(prefix.slice(-1)) && !isNumberCheck) {
      isInputStreamed = true
      output.push('~>')
    } else if (/^[0-9]+$/.test(prefix) && !isNumberCheck) {
      isInputStreamed = true
      output.push('~>')
    } else if (/true|false|null|nan/i.test(prefix) && !isNumberCheck) {
      isInputStreamed = true
      output.push('~>')
    } else if (!/[\(|\[|\{|\$|\.|`]/.test(prefix.slice(-1))) {
      if (!isNumberCheck) {
        output.push('.')
      }
    }
  }

  const inputContext = isInputStreamed ? '' : '$'

  if (isPrimitiveCheck) {
    output.push(` $typeof(${inputContext}) ${negate ? '!' : ''}= "${type}"`)
  } else if (isConstantCheck || isNumberCheck || isStringCheck) {
    if ('nan' === type.toLowerCase()) {
      output.push(` $isNaN(${inputContext}) ${negate ? '!' : ''}= true`)
    } else {
      output.push(` ${negate ? '!' : ''}= ${type}`)
    }
  } else if (isSpecialCheck) {
    output.push(` ${specials[type.toLowerCase()]} ${negate ? '!' : ''}= true`)
  } else if (isInstanceCheck) {
    output.push(` $classConstructorName(${inputContext}) = "${instances[type.toLowerCase()]}"`)
  } else {
    switch (expr) {
      case 'empty': output.push(` $length(${inputContext}) = 0`); break
      case 'not empty': output.push(` $length(${inputContext}) > 0`); break
      default: output.push(`is${camelcase(type)}`)
    }
  }

  return output.join(' ')
}

module.exports = {
  transform
}
