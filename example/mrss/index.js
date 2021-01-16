const mrss = require('../../mrss')
const path = require('path')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'mrss', 'feed.xml')
const document = mrss.Document.from(fs.createReadStream(filename))

document.ready(() => {
  console.log(document.channel);
})
