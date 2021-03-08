const blake2b = require('blake2b')

function hash(value, size, digest) {
  if (Array.isArray(value)) {
    value = Buffer.concat(value
      .filter((v) => 'string' === typeof v || Buffer.isBuffer(v))
      .map((v) => Buffer.from(v))
    )
  } else {
    value = Buffer.from(value)
  }

  return blake2b(size || 16)
    .update(value)
    .digest(digest || 'hex')
}

module.exports = {
  hash
}
