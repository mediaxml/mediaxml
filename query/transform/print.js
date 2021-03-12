const REGEX = /(\$?print\s*?(.*)(;|\n|\r|$))/mg

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, statement, input) {
    return compile(ctx, { statement, input })
  }
}

function compile(ctx, { statement, input }) {
  if ('$' === statement[0]) {
    return statement.replace(/;$/, '')
  }

  ctx.output.push(input)
  return ''
}

module.exports = {
  transform
}
