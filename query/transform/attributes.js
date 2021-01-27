const { normalizeKey } = require('../../normalize')

function transform(queryString) {
  return queryString
    // `attr(key)` attribute selector
    .replace(/(:)?attr\(\s*['|"|`]?([0-9|a-z|A-Z|\:\-|_]+)?['|"|`]?\s*\)/g, (str, $1, name, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      name = normalizeKey(name)
      return `${prefix}attributes.${name}`
    })
    // `:attr or `:attributes` - gets all attributes
    .replace(/(:)?attr(s)?(ibutes)?(\(\))?/g, (_, $1, $2, $3, $4, offset, source) => {
       const prefix = ':' !== $1 || /(\(|\[|\.|^$)/.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
       return `${prefix}attributes`
    })
}

module.exports = {
  transform
}
