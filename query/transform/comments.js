function transform(queryString, ctx) {
  return queryString.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
}

module.exports = {
  transform
}
