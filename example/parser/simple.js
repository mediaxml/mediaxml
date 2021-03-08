const { Parser } = require('../../parser')
const path = require('path')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'adi1', 'tvshow.xml')
const stream = fs.createReadStream(filename)
const parser = new Parser()

stream.pipe(parser.createWriteStream())
  .on('error', (err) => { console.log(err.message || err) })
  .on('finish', () => {
    //parser.createReadStream().pipe(process.stdout)
    const node = parser.query(':children')
    console.log(node);
  })
