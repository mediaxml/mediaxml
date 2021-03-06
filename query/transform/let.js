const { normalizeKey, normalizeValue } = require('../../normalize')
const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

const REGEX = /[^|\n]\s*let\s*([a-z|A-Z|0-9|_|\$|\-]+)\s*?:?=\s*?(.*)(;|\n|$)/g

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(_, key, value, postfix) {
    value = value.trim()
    const parts = value.split(';')

    if (parts.length) {
      value = parts[0]
      postfix = parts[1] || postfix
    }

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
        debug('let error:', err.stack || err)
      }
    }

    try {
      value = jsonata(value).evaluate({}, {
        ...ctx.assignments,
        ...ctx.bindings
      }) || value
    } catch (err) {
      debug(err.stack || err)
    }

    if ('string' === typeof value) {
      for (const bound in ctx.assignments) {
        const regex = RegExp(`\\$${bound}`, 'g')
        value = value.replace(regex, ctx.assignments[bound])
      }
    }

    // support variable variables
    if ('string' === typeof key) {
      for (const bound in ctx.assignments) {
        const regex = RegExp(`\\$${bound}`, 'g')
        key = key.replace(regex, ctx.assignments[bound])
      }
    }

    value = normalizeValue(value)

    ctx.assign(key, value)
    return '.($noop())'
  }
}

module.exports = {
  transform
}
