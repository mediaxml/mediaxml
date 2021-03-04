const { normalizeKey } = require('../../normalize')

const REGEX = /(:)?attrs?\b\(?\s*?['|"|`]?([a-z|A-Z|0-9|_|\-|\$|\:]+)['|"|`]?\s*\)?/gi

function transform(queryString) {
  return queryString
    .replace(REGEX, replace)
    .replace(/:attributes\b/, '.attributes')
    .replace(/:attrs\(\)/, '.attributes')
    .replace(/:attrs\b/, '.attributes')
    .replace(/\battrs\b/, 'attributes')
    .replace(/\battrs\(\)\b/, 'attributes')

  function replace(_, selector, name) {
    const output = []

    if (selector) {
      output.push('.')
    }

    output.push('attributes')

    if (name) {
      output.push('.')
      output.push(normalizeKey(name))
    }

    return output.join('')
  }
}

module.exports = {
  transform
}
