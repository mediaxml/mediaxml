const { Parser } = require('../../parser')
const path = require('path')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'adi1', 'tvshow.xml')
const stream = fs.createReadStream(filename)
const parser = new Parser()

module.exports = parser

stream.pipe(parser.createWriteStream())
  .on('error', (err) => { console.log(err.message || err) })
  .on('finish', () => {
    const { rootNode } = parser
    console.log(getADIMetadata(rootNode))
    console.log(getADIAssets(rootNode));
    console.log(getADIAssets(rootNode).map(getAssetMetadata));
  })

function getADIMetadata(node) {
  return node.query('[name="metadata"]')
}

function getADIAssets(node) {
  return node.query('[name="asset"]')
}

function getAssetMetadata(node) {
  return node.query('[name="metadata"]')
}
