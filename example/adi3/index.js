const { inspect } = require('util')
const { Parser } = require('../../')
const chromafi = require('@12core/chromafi')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')

const filename = path.resolve(__dirname, 'movie.xml')
const stream = fs.createReadStream(filename)
const parser = new Parser()

stream.pipe(parser.createWriteStream())
  .on('error', (err) => {
    console.log(err.message || err)
  })
  .on('finish', () => {
    const result = parser.query(process.argv[2] || '', argv)

    if (result && argv.inspect && inspect.custom in result) {
      let output = result[inspect.custom]().trim()
      output = chromafi(output, {
        codePad: 0,
        lineNumberPad: 0,
        lineNumbers: false,
        stripIndent: false,
        consoleTabWidth: 2,
        tabsToSpaces: 8,
        lang: 'xml'
      })
      console.log('\n%s', output.trim().replace(/\n+/, '\n').trim())
    } else {
      console.log(result)
    }
  })
