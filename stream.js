const { resolve} = require('./resolve')
const get = require('get-uri')
const fs = require('fs')

async function createReadStream(uri, opts) {
  opts = { ...opts }

  if (!uri) {
    return
  }

  // quack
  if (uri && 'function' === typeof uri.pipe) {
    return uri
  }

  uri = resolve(uri, opts)

  try {
    fs.accessSync(uri, fs.constants.R_OK | fs.constants.F_OK)
    return fs.createReadStream(uri)
  } catch (err) {
    void err
  }

  return new Promise((resolve, reject) => {
    return get(uri, (err, stream) => {
      return err ? reject(err) : resolve(Object.assign(stream, { uri }))
    })
  })
}

module.exports = {
  createReadStream
}
