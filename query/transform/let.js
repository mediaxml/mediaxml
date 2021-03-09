const REGEX = /\blet\s*([a-z|A-Z|0-9|_|$|-]+)\s*?:?=\s*?(.*)(;|\n|$)/g

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

    ctx.assign(key, value)
    return ''
  }
}

module.exports = {
  transform
}
