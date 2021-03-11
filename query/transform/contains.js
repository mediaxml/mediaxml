const REGEX = /((?!\s$).*)\s*?contains\b\s*((['|"].*['|"])|([0-9|a-z|A-Z|$|_|.]+))/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, type) {
    prefix = (prefix || '').replace(REGEX, replace)
    return compile({ prefix, type })
  }
}

function compile({ prefix, type }) {
  const normalizedPrefix = prefix.trim()
  const output = [prefix]

  if (/([[]|or|and)$/.test(normalizedPrefix)) {
    output.push('$ ~>')
  } else {
    output.push('~>')
  }

  if (/^\$/.test(type)) {
    output.push(` $contains(${type})`)
  } else {
    type = type.replace(/^['|"]/, '').replace(/['|"]$/, '')
    output.push(` $contains("${type}")`)
  }

  return output.join(' ')
}

module.exports = {
  transform
}
