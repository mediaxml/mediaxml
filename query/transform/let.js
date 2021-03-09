const REGEX = /\blet\s*([a-z|A-Z|0-9|_|$|-]+)\s*?:?=\s*?(.*)(;|\n|$)/g

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, key, value, postfix) {
    return compile(ctx, { key, value, postfix })
  }
}

function compile(ctx, { key, value, postfix }) {
  value = value.trim()
  const parts = value.split(';')


  if (parts.length) {
    value = parts[0]
    postfix = parts[1] || postfix
  }

  if (postfix && !['\n', ';'].includes(postfix)) {
    throw Object.assign(new Error('Unexpected end of input.'), {
      token: '(end)'
    })
  }

  ctx.assign(key, value)
  return ''
}

module.exports = {
  transform
}
