function transform(queryString) {
  return queryString
    // transform `is [not] <thing>` -> `is([not] thing)
    .replace(/(is)\s*((not)?\s*)?(node|text|node|fragment|number|string|object|function|array|date|null|false|true)/ig, (_, $1, $2, $3, $4) => `is(${$2 || ''}${($4 || '').toLowerCase()})`)

    // `:is([not] type)` - predicate function to determine type
    .replace(/([\(|\[|a^]|and|or|in)?\s*([a-z|A-Z|_|\-|0-9|\.|*]+)?\s*(:|a^)?is\s*\(\s*([a-z|A-Z|_|-|0-9|.]+\s*[a-z|A-Z|_|-|0-9|.]+)\s*\)/g, (_, $1, $2, $3, type, offset, source) => {
      $1 = $1 || ''
      $2 = $2 || '$'
      type = type || ''

      const prefix = (
        ':' !== $2 && (/(\(|\[|\.)/.test($2) || ($1 && /(\(|\[|\.|and|or|in)/.test($1)))
        ? '  ' : '.'
      )

      type = type.replace(/(not)(\s*)(null)/ig, (_, $1) => `${($1 || '').toLowerCase()} null`.trim())
      type = type.replace(/(node|text|node|fragment|number|string|object|function|array|date|null|true|false)/gi, (_, $1) => $1.toLowerCase())

      switch (type) {
        case 'null': return `${$1}${prefix}${$2} = null`
        case 'not null': return `${$1}${prefix}${$2} != null`

        case 'true': return `${$1} ${prefix}${$2} = true`
        case 'not true': return `${$1} ${prefix}${$2} != true`

        case 'false': return `${$1} ${prefix}${$2} = false`
        case 'not false': return `${$1} ${prefix}${$2} != true`

        case 'text': return ` ${$1}${prefix}isText`
        case 'not text': return ` ${$1}${prefix}isText != true`

        case 'node': return ` ${$1}${prefix}isParserNode`
        case 'not node': return ` ${$1}${prefix}isParserNode != true`

        case 'fragment': return ` ${$1}${prefix}isFragment`
        case 'not fragment': return ` ${$1}${prefix}isFragment != true`

        case 'number': return ` ${$1}${prefix}${$2}.$typeof($) = "number"`
        case 'not number': return ` ${$1}${prefix}${$2}.$typeof($) != "number"`

        case 'string': return ` ${$1}${prefix}${$2}.$typeof($) = "string"`
        case 'not string': return `${$1}${prefix}${$2}.$typeof($) != "string"`

        case 'object': return ` ${$1}${prefix}${$2}.$typeof($) = "object"`
        case 'not object': return `${$1} ${prefix}${$2}.$typeof($) != "object"`

        case 'boolean': return `${$1} ${prefix}${$2}.$typeof($) = "boolean"`
        case 'not boolean': return `${$1} ${prefix}${$2}.$typeof($) != "boolean"`

        case 'array': return ` ${$1}${prefix}${$2}.$isArray($)`
        case 'not array': return `${$1} ${prefix}${$2}.$isArray($) != true`

        case 'date': return ` ${$1}${prefix}${$2}.$classConstructorName($) = "Date"`
        case 'not date': return ` ${$1}${prefix}${$2}.$classConstructorName($) != "Date"`

        case 'document': return `${$1} ${prefix}${$2}.$classConstructorName($) = "Document"`
        case 'not document': return `${$1} ${prefix}${$2}.$classConstructorName($) != "Document"`

        default: return type ? (` ${$1}${prefix}${$2}is${camelcase(type)}`) : ''
      }
    })
}

module.exports = {
  transform
}
