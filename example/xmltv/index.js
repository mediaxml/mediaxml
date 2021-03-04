const path = require('path')
const xmltv = require('../../xmltv')
const fs = require('fs')

const filename = path.resolve(__dirname, 'epg.xml')
const document = xmltv.Document.from(fs.createReadStream(filename))

document.ready(() => {
  console.log(document.query(`programmes[$int(start) < $int("${Date()}")].start as date`))
})
.catch(console.error)
