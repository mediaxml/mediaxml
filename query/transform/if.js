const REGEX = /\bif(\s|\n|.*)*}/mg

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(source) {
    const value = parse(ctx, source).replace(REGEX, replace)
    return value
  }
}

function parse(ctx, source) {
  const statements = {
    if: null,
    elseif: [],
    else: null
  }

  let i = 0

  while (i < source.length) {
    const expr = scan('}')
    if ('string' === typeof expr) {
      consume(expr)
      continue
    }

    switch (expr.name) {
      case 'if': statements.if = expr; break
      case 'else if': statements.elseif.push(expr); break
      case 'else': statements.else = expr; break
      default: continue
    }
  }

  if (!statements.if) {
    throw new Error('Missing initial `if (condition) { ... }` expression.')
  }

  if (ctx.evaluate(statements.if.condition)) {
    return statements.if.body.slice(1, -1).trim()
  }

  for (const elseif of statements.elseif) {
    if (ctx.evaluate(elseif.condition)) {
      return elseif.body.slice(1, -1).trim()
    }
  }

  if (statements.else) {
    return statements.else.body.slice(1, -1).trim()
  }

  return ''

  function consume(string) {
    i += string.length
  }

  function peek(start, stop) {
    return source.slice((start || i), (start + stop) || source.length)
  }

  function scan(stop) {
    const scopes = { parens: [], brackets: [] }
    const buffer = []

    for (; i < source.length; ++i) {
      const ch = source[i]

      if ('(' === ch) {
        scopes.parens.push(ch)
      }

      if ('{' === ch) {
        scopes.brackets.push(ch)
      }

      if (')' === ch) {
        scopes.parens.shift()
      }

      if ('}' === ch) {
        scopes.brackets.shift()
      }

      if (stop && ch === stop) {
        if (')' === ch && 0 === scopes.parens.length) {
          buffer.push(ch)
          break
        } else if ('}' === ch && 0 === scopes.brackets.length) {
          buffer.push(ch)
          break
        }
      }

      const tmp = buffer.join('').trim()
      switch (tmp) {
        case 'if': {
          const ptr = shift()
          const condition = scan(')')
          const body = scan('}')

          return {
            name: ptr.trim(),
            body: body.trim(),
            condition: condition.trim()
          }
        }

        case 'else if': {
          const ptr = shift()
          const condition = scan(')')
          const body = scan('}')

          return {
            name: ptr.trim(),
            body: body.trim(),
            condition: condition.trim()
          }
        }

        case 'else': {
          const ptr = shift()
          const next = peek().trim()

          if ('{' !== next[0]) {
            buffer.push(...ptr, ch)
            break
          }

          const body = scan('}')

          return {
            name: ptr.trim(),
            body: body.trim()
          }
        }

        default:
          buffer.push(ch)

      }
    }

    i += 1

    return shift()

    function shift(offset, length) {
      return buffer.splice(offset || 0, length || buffer.length).join('')
    }
  }
}

function compile(ctx, { condition, body, elseStatement, elseBody }) {
  if (condition) {
    condition = condition.trim()
  }

  if (body) {
    body = body.trim()
  }

  if (elseStatement) {
    elseStatement = elseStatement.trim()
  }

  if (elseBody) {
    elseBody = elseBody.trim()
  }

  const value = ctx.evaluate(condition)
  if (value) {
    return body
  } else if (elseBody) {
    return elseBody
  }

  return ''
}

module.exports = {
  transform
}
