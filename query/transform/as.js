const REGEX = /((?!\s$)[\)|\]|\}|\$|\.|`|'|"|0-9|a-z|A-Z]+)?\s*?(\:)?as\s*?\(?\s*?([a-z|A-Z|0-9]+)/g

function transform(queryString) {

  return queryString.replace(REGEX, replace)

  function replace(_, prefix, selector, type) {
    selector = (selector || '').trim()
    prefix = (prefix || '').trim()

    const primitives = ['string', 'number', 'boolean', 'function', 'object', 'function']
    const constants = ['null', 'true', 'false', 'nan']
    const instances = { date: 'Date', document: 'Document' }
    const specials = { text: 'isText', node: 'isParserNode', fragment: 'isFragment' }

    const output = [prefix]

    console.log(prefix, selector, type);
    return output.join(' ')

  }

  return queryString
    // `(:|as)keys` - selector to return the keys of the target
    .replace(/(:|as)(\s*)keys/ig, as('$keys(@1)'))

    // `(:|as)json` - selector to return JSON object representation of target
    .replace(/(:|as)(\s*)json(\(\s*['|"|`]?([a-z|A-Z|0-9|_]+)?['|"|`]?\s*\))?/ig, as('$json(@1@3)'))

    // `(:|as)tuple` - selector to return tuple key-value pair of target
    .replace(/(:|as)(\s*)tuple/ig, as('$tuple(@1)'))

    // `(:|as)number` - selector to return number representation of target
    .replace(/(:|as)(\s*)(number|float)(\(\s*['|"|`]?([a-z|A-Z|0-9|_]+)?['|"|`]?\s*\))?/ig, as('$float(@1@4)'))

    // `(:|as)int` - selector to return number representation of target
    .replace(/(:|as)(\s*)int\(?\s*['|"|`]?([a-z|A-Z|0-9|_]+)?['|"|`]?\s*\)?/ig, as('$int(@1@3)'))

    // `(:|as)string` - selector to return string representation of target
    .replace(/(:|as)(\s*)string\(?\s*['|"|`]?([a-z|A-Z|0-9|_]+)?['|"|`]?\s*\)?/ig, as('$string(@1@3)'))

    // `(:|as)array` - selector to return array representation of target
    .replace(/(:|as)(\s*)array/ig, as('$array(@1)'))

    // `(:|as)date` - selector to return date representation of target
    .replace(/(:|as)(\s*)date/ig, as('$date(@1)'))

    // `(:|as)null` - selector to return target as null
    .replace(/(:|as)(\s*)null/ig, as('$null(@1)'))

    // `(:|as)boolean` - selector to return target as a boolean
    .replace(/(:|as)(\s*)boolean/ig, as('$boolean(@1)'))

    // `(:|as)true` - selector to return target as a boolean
    .replace(/(:|as)(\s*)true/ig, as('$true(@1)'))

    // `(:|as)false` - selector to return target as a boolean
    .replace(/(:|as)(\s*)false/ig, as('$false(@1)'))

  function as(postfix) {
    return (_, $1, $2, $3, $4) => {
      return (normalizeSelectingIdentifier($1) + `${$2}${postfix}`)
        .replace('@1', ':' === $1 ? '$': '')
        .replace('@2', (arg) => $2 ? $2 : '')
        .replace('@3', (arg) => $3 ? $3 : '')
        .replace('@4', (arg) => $4 ? $4 : '')
    }
  }
}

function normalizeSelectingIdentifier(s) {
  return s.replace(':', '.').replace('as', '~>')
}

module.exports = {
  transform
}
