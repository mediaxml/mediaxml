const REGEX = /let\s*([a-z|A-Z|0-9|_|$|-]+)\s*?([+|-|*|/]?:?=)\s*(['|"|`](\n|\s|;|.*)+['|"|`])(\s|\n|;|$)/mg
const REGEX2 = /let\s*([a-z|A-Z|0-9|_|$|-]+)\s*?([+|-|*|/]?:?=)\s*(\n|\s|.*)(;|$)/mg

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace).replace(REGEX2, replace)
  return result

  function replace(_, key, operator, value, postfix) {
    return compile(ctx, { key, operator, value, postfix })
  }
}

function compile(ctx, { key, operator, value, postfix }) {
  value = value.trim()

  if (/['|"|`|;|\n]$/.test(value)) {
    postfix = value.slice(-1)
  }

  if (/[;]$/.test(value)) {
    value = value.slice(0, -1)
  }

  if (postfix && !['\n', ';', '\'', '"', '`'].includes(postfix)) {
    throw Object.assign(new Error('Unexpected end of input.'), {
      token: '(end)'
    })
  }

  if (/^'/.test(value) && (!/'$/.test(value) || 1 === value.length)) {
    throw Object.assign(new Error('Missing corresponding quote. (\')'), { token: '(end)' })
  }

  if (/^"/.test(value) && (!/"$/.test(value) || 1 === value.length)) {
    throw Object.assign(new Error('Missing corresponding quote. (")'), { token: '(end)' })
  }

  if (/^`/.test(value) && (!/`$/.test(value) || 1 === value.length)) {
    throw Object.assign(new Error('Missing corresponding quote. (`)'), { token: '(end)' })
  }

  let existing = null
  switch (operator) {
    case '+=':
      existing = ctx.getValue(key)
      value = ctx.normalizeValue(value)
      if (!existing && 'number' === typeof value) {
        existing = 0
      } else if (!existing) {
        existing = ''
      }
      ctx.assign(key, existing + value)
      break

    case '-=':
      existing = ctx.getValue(key)
      value = ctx.normalizeValue(value)
      if (!existing) {
        existing = 0
      }
      ctx.assign(key, existing - value)
      break

    case '*=':
      existing = ctx.getValue(key)
      value = ctx.normalizeValue(value)
      if (!existing) {
        existing = 0
      }
      ctx.assign(key, existing * value)
      break

    case '/=':
      existing = ctx.getValue(key)
      value = ctx.normalizeValue(value)
      if (!existing) {
        existing = 0
      }
      ctx.assign(key, existing / value)
      break

    default:
      ctx.assign(key, value)
  }

  return ''
}

module.exports = {
  transform
}
