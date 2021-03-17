const chalk = require('chalk')

function createPrompt(name, context, opts) {
  if (!context && !opts || (context && 'object' === typeof context)) {
    opts = context
    context = '-'
  }

  opts = opts || {}
  let prompt = ''

  if (false !== opts.colors) {
    prompt += chalk.bold(name)
  } else {
    prompt += name
  }

  prompt += '('
  if (false !== opts.colors) {
    prompt += chalk.italic(context)
  } else {
    prompt += context
  }

  prompt += ')> '

  return prompt
}

module.exports = {
  createPrompt
}
