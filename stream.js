const path = require('path')
const get = require('get-uri')
const fs = require('fs')

async function createReadStream(filename, opts) {
  opts = { ...opts }

  if (!filename) {
    return
  }

  // quack
  if (filename && 'function' === typeof filename.pipe) {
    return filename
  }

  if (/^file:\/\//.test(filename)) {
    filename = filename.replace('file://', '')
  }

  try {
    if (opts.cwd) {
      const tmp = path.resolve(opts.cwd, filename)
      fs.accessSync(tmp, fs.constants.R_OK | fs.constants.F_OK)
      filename = tmp
    } else {
      fs.accessSync(filename, fs.constants.R_OK | fs.constants.F_OK)
    }
    return fs.createReadStream(filename)
  } catch (err) {
    void err
  }

  return new Promise((resolve, reject) => {
    return get(filename, (err, stream) => {
      return err ? reject(err) : resolve(stream)
    })
  })
}

module.exports = {
  createReadStream
}
