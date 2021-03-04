const { ParserNodeText } = require('./parser')

/**
 * A high level container for text content.
 * @public
 * @memberof text
 */
class Text extends ParserNodeText { }

/**
 * A module that provides a container for text nodes.
 * @public
 * @module text
 * @example
 * const { Text } = require('mediaxml/text')
 * const text = Text.from('hello world')
 * node.appendChild(text)
 * const textNodes = node.query('**[ is text and is not empty ]')
 */
module.exports = {
  Text
}
