function transform(queryString) {
  return queryString
    .trim()
    // replace `this` and `self` references with `$`
    .replace(/((^|\[|\())?(\s*)?(this|self)(\s*)?/g, '$1 $ ')
    // `:name` - selector to return the current node name
    .replace(/:name/g, '.name')
    // `:key` - selector to return the 'key' property
    .replace(/:key/g, '.key')
    // `:value` - selector to return the 'value' property
    .replace(/:value/g, '.value')
    // `:root` - selector to return the current root
    .replace(/:root/g, '$')
    // `:match` - selector to return match from regex
    .replace(/(:)match/g, (_, $1, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      return `${prefix}match`
    })
    // `:text` - selector to return body text of node
    .replace(/(:)text/g, (_, $1, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      return `${prefix}body.text`
    })
}

module.exports = {
  transform
}
