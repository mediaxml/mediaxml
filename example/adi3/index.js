const path = require('path')
const adi3 = require('../../adi3')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'adi3', 'movie.xml')
const document = adi3.Document.from(fs.createReadStream(filename))

document.ready(() => {
  //console.log(document.query('assets[type ~> /(content:PreviewType|content:MovieType)/i]')[0])
  for (const asset of document.assets) {
    console.log(asset.type);
  }
})
.catch(console.error)
