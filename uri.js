const isURL = require('is-url-superb')
const path = require('path')

function resolve(uri, opts) {
  opts = { ...opts }
  let { fs } = opts

  if (!fs) {
    try {
      fs = require('fs')
    } catch (err) {
      void err
    }
  }

  if ('string' !== typeof uri) {
    return null
  }

  if (/^file:\/\//.test(uri)) {
    uri = uri.replace('file://', '')
  }

  if (isURL(uri)) {
    return uri
  }

  if (!fs || 'function' !== typeof fs.accessSync) {
    return null
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
