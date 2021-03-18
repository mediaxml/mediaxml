const { ParserNode, ParserNodeAttributes } = require('../parser')
const { inspect } = require('util')
const chromafi = require('@12core/chromafi')
const chalk = require('chalk')

function pretty(result, opts) {
  opts = { ...opts }

  if (
    !ParserNode.isParserNode(result) &&
    false === (result instanceof ParserNodeAttributes)
  ) {
    if (result && result._jsonata_function) {
      const name = (result.implementation.name || 'bound').replace(/^\$/, '')
      const signature = result.signature.definition
      const { description } = result.implementation

      if (false === opts.colors) {
        return `${name}(${signature})${(description ? ` // ${description}` : '')}`
      } else {
        return chalk.italic(`${chalk.cyan(name)}(${chalk.bold(signature)})`) + (
          description
          ? ` ${chalk.magenta('//')} ${chalk.italic(description)}`
          : ''
        )
      }
    } else if ('function' === typeof result) {
      const name = (result.name || 'bound').replace(/^\$/, '')
      const signature = result.signature || '..'
      const description = result.description || ''

      if (false === opts.colors) {
        return `${name}(${signature})${(description ? ` // ${description}` : '')}`
      } else {
        return chalk.italic(`${chalk.cyan(name)}(${chalk.bold(signature)})`) + (
          description
          ? ` ${chalk.magenta('//')} ${chalk.italic(description)}`
          : ''
        )
      }
    } else {
      return inspect(result, { colors: false !== opts.colors })
    }
  }

  const output = inspect.custom in result
    ? result[inspect.custom]({ colors: false !== opts.colors })
    : result

  if (Array.isArray(output)) {
    return output.reduce((string, object) => string + (
      print((
        object && 'object' === typeof object && inspect.custom in object)
        ? object[inspect.custom]({ colors: false !== opts.colors })
        : object)
    ) + '\n', '')
  }

  if (false !== opts.color) {
    return print(output)
  } else {
    return output
  }
}

function print(out) {
  if (false === (out instanceof String) && 'object' !== typeof out && 'string' !== typeof out) {
    return out
  }

  return chromafi(out, {
    consoleTabWidth: 0,
    lineNumberPad: 0,
    tabsToSpaces: 2,
    lineNumbers: false,
    stripIndent: false,
    decorate: false,
    codePad: 0,
    lang: 'xml'
  })
}

module.exports = {
  pretty
}
