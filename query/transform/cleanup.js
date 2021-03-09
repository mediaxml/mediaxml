function transform(queryString) {
  const result = queryString
    .trim()
    .replace(/\n+/g, ' ')
    // prepend `$` for root if missing
    .replace(/^\./, '$.')
    .replace(/;[$|\n|\s]/, '')
    .replace(/\.\s*?$/, '')

  return result
}

module.exports = {
  transform
}
