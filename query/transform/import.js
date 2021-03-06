const jsonata = require('jsonata')
const debug = require('debug')('mediaxml')

const REGEX = /\s*import\s*(.*)(;|\n|$)?/g

function transform(queryString, ctx) {
  const result = queryString.replace(REGEX, replace)
  return result

  function replace(_, target) {
    return compile({ target }, ctx)
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

  if ('string' === typeof target || target instanceof String) {
    try {
      target = target.replace(/^'/, '"').replace(/'$/, '"')
      target = JSON.parse(target)
    } catch (err) {
      debug(err.stack || err)
    }
  }

  try {
    const expression = jsonata(target)

    for (const key in ctx.bindings) {
      const binding = ctx.bindings[key]
      expression.registerFunction(key, binding, binding.signature)
    }

    target = expression.evaluate({}, ctx.assignments) || target
  } catch (err) {
    debug(err.stack || err)
  }

  for (const bound in ctx.assignments) {
    const regex = RegExp(`\\$${bound}`, 'g')
    target = target.replace(regex, ctx.assignments[bound])
  }

  if (target) {
    ctx.import(target)
  }

  return ''
}

module.exports = {
  transform
}
