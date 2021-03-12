const REGEX = /if\s*\((.*?)\)\s*{\n?(\s*|.*?)\n?}\s*?(\s*?else\s*{\n?(\s*|.*?)\n?})*/mg

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, condition, body, elseStatement, elseBody) {
    return compile(ctx, { condition, body, elseStatement, elseBody })
      .replace(REGEX, replace)
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
