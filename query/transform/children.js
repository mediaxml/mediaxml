function transform(queryString) {
  return queryString
    // `:children()` - selector to return child nodes
    .replace(/(:|a^)?children\(([\s]+)?\)/g, (_, $1, $2, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      return `${prefix}children`
    })
    // `:children(start[, count]) - slice children into a fragment array
    .replace(/(:|a^)?(children\()([0-9]+)?\s?(,?)\s?([0-9]+)?(.*)(\))/, (_, $1, $2, $3, $4, $5, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      if ($3 && $4 && $5) {
        return `${prefix}$slice(children, ${$3}${$4} (${$3} + ${$5}))`
      } else if ($3 && !$4) {
        return `${prefix}$slice(children, ${$3})`
      }
    })
    // `:children` - fallback and alias for `.children` property access
    .replace(/:children/g, '.children')
    // `:nth-child(n)` - return the nth child of the node
    .replace(/(:|a^)?nth-child\(([0-9]+)\)/g, (_, $1, $2, offset, source) => {
      const prefix = ':' !== $1 || /\(|\[|\./.test(source.slice(Math.max(0, offset - 1))[0]) ? '' : '.'
      return `${prefix}children[${$2}]`
    })
}

module.exports = {
  transform
}
