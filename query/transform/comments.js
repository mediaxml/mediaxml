const strip = require('strip-json-comments')

function transform(queryString, ctx) {
  return strip(queryString, {
    whitespace: false
  })
}

module.exports = {
  transform
}
