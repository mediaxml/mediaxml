const { URL } = require('url')
const path = require('path')

function resolve(uri, opts) {
  const { fs = require('fs') } = (opts || {})

  if ('string' !== typeof uri) {
    return null
  }

  if (/^file:\/\//.test(uri)) {
    uri = uri.replace('file://', '')
  }

  try {
    void new URL(uri)
    return uri
  } catch (err) {
    void err
  }

  try {
    if (opts && opts.cwd) {
      const tmp = path.resolve(opts.cwd, uri)
      fs.accessSync(tmp, fs.constants.R_OK | fs.constants.F_OK)
      uri = tmp
    }

    fs.accessSync(uri, fs.constants.R_OK | fs.constants.F_OK)
    return uri
  } catch (err) {
    return null
  }
}

module.exports = {
  resolve
}
