const REGEX = /([^|^$|\b]print\s*(.*)(;|\n|\r|$))/g

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, statement, input) {
    return compile(ctx, { statement, input })
  }
}

function compile(ctx, { input }) {
  ctx.output.push(input)
  return ''
}

module.exports = {
  transform
}
