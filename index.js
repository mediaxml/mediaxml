const { Document } = require('./document')
const { Parser } = require('./parser')
const { Entity } = require('./entity')
const mrss = require('./mrss')
const rss = require('./rss')

/**
 * Module exports.
 * @private
 */
module.exports = {
  Document,
  Parser,
  Entity,

  mrss,
  rss
}
