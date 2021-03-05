const mrss = require('../../mrss')
const path = require('path')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'mrss', 'feed.xml')
const document = mrss.Document.from(fs.createReadStream(filename))

document.ready(() => {
  const items = document.query('channel.items')
  const titles = items.query('title') // items is a `Fragment` with a `query()` function
  const urls = items.query('mediaContent.url[contains "mp4"]')
  console.log(urls);
})
.catch(console.error)
