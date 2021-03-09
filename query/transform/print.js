
const REGEX = /([$]?print\s*(.*)(;|\n|\r|$))/g

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, statement, input) {
    return compile(ctx, { statement, input })
  }
}

function compile(ctx, { statement, input }) {
  statement = (statement || '').trim()

  // bail on `$print()` calls
  if ('$' === statement[0]) {
    return statement
  }

  ctx.output.push(input)

  return ''
}

module.exports = {
  transform
}
