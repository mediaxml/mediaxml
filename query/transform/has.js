const REGEX = /((?!\s$).*)\bhas\b\s*(['|"]?[a-z|A-Z|0-9|_]+['|"]?)/g

function transform(queryString) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, prefix,type) {
    prefix = prefix || ''

    const normalizedPrefix = prefix.trim()
    const output = [prefix]

    if (/[\[]$/.test(normalizedPrefix)) {
      output.push('$ ~>')
    } else {
      output.push('~>')
    }

    type = type.replace(/^['|"]/, '').replace(/['|"]$/, '')
    output.push(` $has("${type}")`)

    return output.join(' ')
  }
}

module.exports = {
  transform
}
