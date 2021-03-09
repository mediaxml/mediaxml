function transform(queryString) {
  const result = queryString
    .trim()
    // prepend `$` for root if missing
    .replace(/^\./, '$.')
    .replace(/;[$|\n|\s]/, '')
    .replace(/\.\s*?$/, '')

  return result
}

module.exports = {
  transform
}
