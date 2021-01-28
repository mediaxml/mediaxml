function transform(queryString) {
  return queryString
    .trim()
    // clean up white space
    .replace(/(\s*)($|\]|\))/g, ' $2').replace(/(^|\[|\()(\s*)/g, '$1 ')
    // replace trailing `:` with `.`
    .replace(/\:$/, '.')
    // add '*' by default because we are always searching the same node hierarchy
    .replace(/^\s*\[/, '*[')
    // lowercase special key words
    .replace(/\s?(AND|OR|NULL)\s?/g, ($1) => $1.toLowerCase())
    .replace(/\s?(And|Or|Null)\s?/g, ($1) => $1.toLowerCase())
}

module.exports = {
  transform
}
