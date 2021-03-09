const { Assignments, Imports } = require('./query')
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

    const { parser, imports } = context
    const cacheKey = hash([state.cwd, uri])
    const buffers = []
    const { cwd } = state
    let stream = null

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    return new Promise(resolver)

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

      context.imports.cwd = state.cwd

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

        cache.set(cacheKey, result)
        imports.set(uri, result)
        context.imports.cwd = state.cwd
        state.paths.pop()

        if (!result) {
          const value = parser.query(string, context)
          if (value instanceof Promise) {
            imports.backlog.push(value)
          } else if (value) {
            result = value
          }
        }

        resolve(result)
      }
    }
  }
}

module.exports = {
  createLoader
}
