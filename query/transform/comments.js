const strip = require('strip-comments')

function transform(queryString, ctx) {
  return strip(queryString, {
    whitespace: false
  })
}

module.exports = {
  transform
}
