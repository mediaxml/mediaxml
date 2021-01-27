function transform(queryString) {
  return queryString
    .trim()
    // prepend `$` for root if missing
    .replace(/^[.|\,]+/, '$.')
}

module.exports = {
  transform
}
