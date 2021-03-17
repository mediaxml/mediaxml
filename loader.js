const { ValidationError } = require('./validate')
const { Parser } = require('./parser')
const { fetch } = require('./fetch')
const { hash } = require('./hash')
const debug = require('debug')('mediaxml')

function createLoader(context, opts) {
  opts = { ...opts }

  const { cache = opts.cache || new Map() } = context

  return async function load(uri) {
    if (!uri) {
      throw new Error('Missing URI for load function.')
    }

    let stream = null

    const {  imports } = context
    const cacheKey = hash(uri)
    const buffers = []

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const promise = new Promise(resolver)
    cache.set(cacheKey, promise)

    return promise

    async function resolver(resolve, reject) {
      try {
        stream = await fetch(uri)
      } catch (err) {
        debug(err)
        imports.pending.delete(uri)
        return resolve(null)
      }

      if ('function' === typeof opts.onbeforeload) {
        opts.onbeforeload({ uri, imports })
      }

      stream.once('error', onerror)
      stream.on('data', ondata)
      stream.on('end', onend)

      function onerror(err) {
        if ('function' === typeof opts.onerror) {
          opts.onerror(err, { uri, imports })
        }

        reject(err)
      }

      function ondata(buffer) {
        if ('function' === typeof opts.ondata) {
          opts.ondata(buffer, { uri, imports })
        }

        buffers.push(buffer)
      }

      async function onend() {
        const buffer = Buffer.concat(buffers)
        const string = String(buffer)
        let result = string

        // attempt to load a parsed XML source from buffer string
        try {
          const tmp = Parser.from(string)
          // valid XML was just parsed
          if (tmp.rootNode) {
            context.rootNode = tmp.rootNode
            result = tmp.rootNode
          }
        } catch (err) {
          debug(err.stack || err)
          if (!(err instanceof ValidationError)) {
            return reject(err)
          }
        }

        if ('function' === typeof opts.onload) {
          opts.onload(result, { uri, imports })
        }

        resolve(result)
      }
    }
  }
}

module.exports = {
  createLoader
}
