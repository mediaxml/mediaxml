const REGEX = /((?!\s$).*)contains\b\s*("[a-z|A-Z|0-9|_]+"|'[a-z|A-Z|0-9|_]+'|[a-z|A-Z|0-9|_]+)/g

function transform(queryString) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, prefix,type) {
    prefix = (prefix || '').replace(REGEX, replace)

    const normalizedPrefix = prefix.trim()
    const output = [prefix]

    if (/[\[]$/.test(normalizedPrefix)) {
      output.push('$ ~>')
    } else {
      output.push('~>')
    }

    type = type.replace(/^['|"]/, '').replace(/['|"]$/, '')
    output.push(` $contains("${type}")`)

    return output.join(' ')
  }
}

module.exports = {
  transform
}
