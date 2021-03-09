function transform(queryString) {
  return queryString.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
}

module.exports = {
  transform
}
