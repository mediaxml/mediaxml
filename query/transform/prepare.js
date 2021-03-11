function transform(queryString) {
  const result = queryString
    .replace(/`([^`]*)`/mg, '\'$1\'')
    // remove shebang
    .replace(/^(#!.*)([\n|\r|$])/g, '$2')
    // replace trailing `:` with `.`
    .replace(/:$/, '.')
    // add '*' by default because we are always searching the same node hierarchy
    .replace(/^\s*\[/, '*[')
    // lowercase special key words
    .replace(/\s?(AND|OR|NULL)\s?/g, ($1) => $1.toLowerCase())
    .replace(/\s?(And|Or|Null)\s?/g, ($1) => $1.toLowerCase())

  return result
}

module.exports = {
  transform
}
