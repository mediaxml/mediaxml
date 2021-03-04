const { ParserNodeFragment } = require('./parser')

/**
 * A high level container for fragment content.
 * @public
 * @memberof fragment
 */
class Fragment extends ParserNodeFragment { }

/**
 * A module that provides a container for fragment nodes.
 * @public
 * @module fragment
 * @example
 * const { Fragment } = require('mediaxml/fragment')
 * const { Text } = require('mediaxml/fragment')
 * const fragment = Fragment.from([Text.from('hello'), Text.from('world'), Text.from('')])
 * const textNodes = node.query('**[ is text and is not empty ]')
 */
module.exports = {
  Fragment
}
