const path = require('path')
const adi = require('../../adi')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'adi1', 'tvshow.xml')
const document = adi.Document.from(fs.createReadStream(filename))

document.ready(() => {
  console.log(document.asset)
})
.catch(console.error)
