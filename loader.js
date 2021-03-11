const { createReadStream } = require('./stream')
const { ValidationError } = require('./validate')
const { Parser } = require('./parser')
const { hash } = require('./hash')
const debug = require('debug')('mediaxml')
const path = require('path')
const fs = require('fs')

function createLoader(context, opts) {
  opts = { ...opts }

  const { cache = new Map() } = opts
  const state = {
    paths: [],
    get cwd() {
      const i = Math.max(0, this.paths.length - 1)
      return this.paths[i] || process.cwd()
    }
  }

  return async function load(uri) {
    if (!uri) {
      throw new Error('Missing URI for load function.')
    }

    let stream = null
    let cwd = state.cwd

    const {  imports } = context
    const cacheKey = hash([cwd, uri])
    const buffers = []

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const promise = new Promise(resolver)
    cache.set(cacheKey, promise)
    return promise

    async function resolver(resolve, reject) {
      try {
        stream = await createReadStream(uri, { cwd })
      } catch (err) {
        debug(err)
        imports.pending.delete(uri)
        return resolve(null)
      }

      try {
        void new URL(uri) // this should fail for regular file paths
      } catch (err) {
        try {
          fs.accessSync(uri, fs.constants.R_OK | fs.constants.F_OK)
          state.paths.push(path.resolve(path.dirname(uri)))
        } catch (err) {
          debug(err)
          return reject(err)
        }
      }

      cwd = state.cwd
      context.imports.cwd = cwd

      if ('function' === typeof opts.onbeforeload) {
        opts.onbeforeload({ uri, cwd, imports })
      }

      stream.once('error', onerror)
      stream.on('data', ondata)
      stream.on('end', onend)

      function onerror(err) {
        if ('function' === typeof opts.onerror) {
          opts.onerror(err, { uri, cwd, imports })
        }

        reject(err)
      }

      function ondata(buffer) {
        if ('function' === typeof opts.ondata) {
          opts.ondata(buffer, { uri, cwd, imports })
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
        } finally {
          state.paths.pop()
          context.imports.cwd = state.cwd
        }

        if ('function' === typeof opts.onload) {
          opts.onload(result, { uri, cwd, imports })
        }

        resolve(result)
      }
    }
  }
}

module.exports = {
  createLoader
}
