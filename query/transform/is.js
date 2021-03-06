const camelcase = require('camelcase')

const REGEX = /((?![\(|\[|\{|\*]+$)(?!\s$)?.*)?\s*?(\:)?is(\s*not\s*)?\s*?\(?\s*?(["|']?[\$|_|\-|\.|a-z|A-Z|0-9]+["|']?)((?!\s$)?.*)?\)?/g

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, selector, not, type, postfix) {
    if (prefix) {
      prefix = prefix.replace(REGEX, replace)
    }

    return compile({ prefix, postfix, selector, not, type })
  }
}

function compile({ prefix, postfix, selector, not, type }) {
  selector = (selector || '').trim()
  prefix = (prefix || '').trim()
  not = (not || '').trim()

  const primitives = ['string', 'array' ,'number', 'boolean', 'object', 'function']
  const instances = { date: 'Date', document: 'Document' }
  const constants = ['null', 'true', 'false', 'nan', 'infinity', '$', '$i', '%']
  const specials = { text: 'isText', node: 'isParserNode', fragment: 'isFragment' }
  const negate = 'not' === not.trim()
  const expr = [not, type].join(' ').trim().toLowerCase()

  const isConstantCheck = (
    constants.includes(type.toLowerCase()) ||
    /^[@|#]\$/.test(type.toLowerCase()) ||
    /^$/.test(type.toLowerCase())
  )

  const hasLeadingKeyword = /(and|or|\.)$/.test(prefix)
  const isPrimitiveCheck = primitives.includes(type.toLowerCase())
  const isInstanceCheck = type.toLowerCase() in instances
  const isSpecialCheck = type.toLowerCase() in specials
  const isStringCheck = (/^"/.test(type) && /"$/.test(type)) || (/^'/.test(type) && /'$/.test(type))
  const isNumberCheck = /^[0-9]+$/.test(type)

  const [ leadingCharacter ] = (prefix.match(/^([\(|\[|\{])/) || [])
  const normalizedPrefix = prefix.replace(/^([\(|\[|\{|\s]+)/g, '')
  const output = []

  let isInputStreamed = false

  output.push(prefix)

  if (
    (!isConstantCheck && !isNumberCheck && !isStringCheck) ||
    'nan' === type.toLowerCase()
  ) {
    if (selector && '.' !== normalizedPrefix.slice(-1)) {
      output.push('.')
    } else if (/[\)|\]|\}|\$|\.|`]/.test(normalizedPrefix.slice(-1))) {
      output.push('.')
    } else if (/(true|false|null|nan)$/i.test(normalizedPrefix) && !isNumberCheck) {
      isInputStreamed = true
      output.push('~>')
    } else if (!hasLeadingKeyword) {
      if (/['|"]/.test(normalizedPrefix.slice(-1)) && !isNumberCheck) {
        isInputStreamed = true
        output.push('~>')
      } else if (/[0-9]+$/.test(normalizedPrefix) && !isNumberCheck) {
        isInputStreamed = true
        output.push('~>')
      } else if (!/[\(|\[|\{|\$|\.|`]/.test(normalizedPrefix.slice(-1))) {
        if (!isNumberCheck) {
          output.push('.')
        }
      }
    }
  }

  const inputContext = isInputStreamed ? '' : '$'

  if (!isSpecialCheck && !isInstanceCheck) {
    if (inputContext && output.slice(-1)[0] !== inputContext) {
      if (/\[$/.test(normalizedPrefix)) {
        output.push(inputContext)
      }
    }
  }


  if (isPrimitiveCheck) {
    output.push(` $typeof(${inputContext}) ${negate ? '!' : ''}= "${type}"`)
  } else if (isConstantCheck || isNumberCheck || isStringCheck) {
    if ('nan' === type.toLowerCase()) {
      output.push(` $isNaN(${inputContext}) ${negate ? '!' : ''}= true`)
    } else {
      if (hasLeadingKeyword) {
        output.push(`$ ${negate ? '!' : ''}= ${type}`)
      } else {
        output.push(` ${negate ? '!' : ''}= ${type}`)
      }
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

  if (postfix) {
    output.push(postfix)
  }

  return output.join(' ')
}

module.exports = {
  transform
}
