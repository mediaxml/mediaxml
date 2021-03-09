const { createReadStream } = require('./stream')
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

    let cwd = state.cwd
    const { parser, imports } = context
    const cacheKey = hash([cwd, uri])
    const buffers = []
    let stream = null

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

      stream.once('error', onerror)
      stream.on('data', ondata)
      stream.on('end', onend)

      function onerror(err) {
        reject(err)
      }

      function ondata(buffer) {
        buffers.push(buffer)
      }

      async function onend() {
        const buffer = Buffer.concat(buffers)
        const string = String(buffer)
        const tmp = Parser.from(string)
        let result = null

        // valid XML was just parsed
        if (tmp.rootNode) {
          try {
            context.rootNode = tmp.rootNode
            result = tmp.rootNode
          } catch (err) {
            debug(err.stack || err)
            return reject(err)
          }
        }

        if (!result) {
          try {
            result = await parser.query(string, context)
          } catch (err) {
            return reject(err)
          }
        }

        state.paths.pop()
        context.imports.cwd = state.cwd
        resolve(result)
        imports.finalize(uri, result)
      }
    }
  }
}

module.exports = {
  createLoader
}
