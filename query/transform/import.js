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

  if ('string' === typeof target || target instanceof String) {
    try {
      target = target.replace(/^'/, '"').replace(/'$/, '"')
      target = JSON.parse(target)
    } catch (err) {
    }
  }

  try {
    target = jsonata(target).evaluate({}, {
      ...ctx.assignments,
      ...ctx.bindings
    }) || target
  } catch (err) {
    //debug(err.stack || err)
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
