const { Document, Node, createDocument, createNode } = require('./document')
const { Fragment } = require('./fragment')
const { Parser } = require('./parser')
const { Entity } = require('./entity')
const { query } = require('./query')
const { Text } = require('./text')
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

  createDocument,
  createNode,

  Document,
  Entity,
  Fragment,
  mrss,
  Node,
  Parser,
  rss,
  Text,
  query,
  xmltv
}
