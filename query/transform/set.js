const { normalizeKey, normalizeValue } = require('../../normalize')
const debug = require('debug')('mediaxml')

const REGEX = /^\s*[s|l]et\s*([a-z|A-Z|0-9|_]+)\s*:?=\s*(".*"|'.*'|.*)\s*(;|.*|$)/g

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(_, key, value, postfix) {
    if (postfix && ';' !== postfix) {
      throw Object.assign(new Error('Unexpected end of input.'), {
        token: '(end)'
      })
    }

    if ('string' === typeof value || value instanceof String) {
      try {
        value = value.replace(/^'/, '"').replace(/'$/, '"')
        value = JSON.parse(value)
      } catch (err) {
        debug('set error:', err.stack || err)
      }
    }

    ctx.assign(normalizeKey(key), normalizeValue(value))
    return '.($noop())'
  }
}

module.exports = {
  transform
}
