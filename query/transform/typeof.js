function transform(queryString) {
  return queryString
    .replace(/(\$?typeof\s*?)([0-9|a-z|A-Z|\-|_|\`|\'|"|\$|\.|\:|\s|\(|\)|\&|\%|\#|\@|\*|\!]+)\s*?/ig, '$typeof($2)')
}

module.exports = {
  transform
}
