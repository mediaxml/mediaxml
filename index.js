const { Document } = require('./document')
const { Parser } = require('./parser')
const { Entity } = require('./entity')
const xmltv = require('./xmltv')
const adi3 = require('./adi3')
const mrss = require('./mrss')
const rss = require('./rss')
const adi = require('./adi')

/**
 * Module exports.
 * @private
 */
module.exports = {
  adi,
  adi3,

  Document,
  Entity,
  mrss,
  Parser,
  rss,
  xmltv
}
