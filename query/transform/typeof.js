function transform(queryString) {
  return queryString
    .replace(/[^|\s]+(typeof\s*?)([0-9|a-z|A-Z|\-|_|\`|\'|"|\$|\.|\:|\s|\(|\)|\&|\%|\#|\@|\*|\!]+)\s*?/ig, (_, $1, $2) => `$typeof(${($2 || '').replace(/(\s*[\(|\[][\)|\]]\s*)/g, '')})`)
}

module.exports = {
  transform
}
