const REGEX = /\s*?import\b\s*(.*)(;|\n|$)/g

function transform(queryString, ctx) {
  return queryString.replace(REGEX, replace)

  function replace(statement, target) {
    return compile({ statement, target }, ctx)
  }
}

function compile({ target }, ctx) {
  target = target.replace(/;$/, '')

  if (/^'/.test(target) || /'$/.test(target)) {
    if (!('\'' === target[0] && '\'' === target.slice(-1))) {
      throw new Error('Missing corresponding `\'` in import statement.')
    }
  }

  if (/^"/.test(target) || /"$/.test(target)) {
    if (!('"' === target[0] && '"' === target.slice(-1))) {
      throw new Error('Missing corresponding `"` in import statement.')
    }
  }

  if (target) {
    ctx.import(target)
  }

  return '\n'
}

module.exports = {
  transform
}
