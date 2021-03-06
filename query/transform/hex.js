const REGEX = /\b0x([0-9a-f]+)\b/g

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(_, hex) {
    return parseInt(hex, 16)
  }
}

module.exports = {
  transform
}
