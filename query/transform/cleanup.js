function transform(queryString) {
  const result = queryString
    .trim()
    // prepend `$` for root if missing
    .replace(/^\./, '$.')
    .replace(/;[$|\n|\s]/, '')
    .replace(/\.\s*?$/, '')
    .replace(/([(|[|{]\s*?)([.])/mg, '$1$.')

  return result
}

module.exports = {
  transform
}
