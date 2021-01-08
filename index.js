const { Parser } = require('./parser')

/**
 * `Parser` instance factory.
 * @param {?(ParserOptions)} opts
 * @return {Parser}
 */
function createParser(...args) {
  return new Parser(...args)
}

/**
 * Module exports.
 */
module.exports = {
  createParser,
  Parser
}
