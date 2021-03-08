const { createReadStream } = require('./stream')
const InvertedPromise = require('inverted-promise')
const { Parser } = require('./parser')
const { hash } = require('./hash')
const defined = require('defined')
const debug = require('debug')('mediaxml')
const mutex = require('mutexify')
const path = require('path')
const fs = require('fs')

function createLoader(context, opts) {
  opts = { ...opts }

  let pending = 0
  let loaded = 0

  const backlog = []
  const cache = new Map()
  const lock = mutex()

  const state = {
    paths: [opts.cwd || process.cwd()],
    get cwd() {
      const i = Math.max(0, this.paths.length - 1)
      return this.paths[i]
    }
  }

  return async function load(uri) {
    const { parser, imports } = context
    const cacheKey = hash([state.cwd, uri])
    const buffers = []
    const { cwd } = state
    let stream = null

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const tmp = {}
    const cachedPromise = new InvertedPromise()

    const promise = new Promise((resolve, reject) => {
      cache.set(cacheKey, cachedPromise)
      lock(async (release) => {
        pending++

        try {
          stream = await createReadStream(uri, { cwd })
        } catch (err) {
          debug(err)
          pending--;
          return release(resolve, null)
        }

        try {
          fs.accessSync(path.resolve(cwd, uri), fs.constants.R_OK | fs.constants.F_OK)
          state.paths.push(path.resolve(path.dirname(uri)))
        } catch (err) {
          debug(err)
        }

        stream.once('error', onerror)
        stream.on('data', ondata)
        stream.on('end', onend)

        function onerror(err) {
          pending--;
          release(reject, err)
        }

        function ondata(buffer) {
          buffers.push(buffer)
        }

        async function onend() {
          const buffer = Buffer.concat(buffers)
          const string =  buffer.toString()
          const tmp = Parser.from(string)
          let result = null

          release()
          imports.delete(uri)

          // we just parsed valid XML
          if (tmp.rootNode) {
            context.rootNode = tmp.rootNode
            result = tmp.rootNode
          } else {
            // try to evaluate the string instead if its not XML
            try {
              const hasRootNode = !!parser.rootNode
              result = await parser.query(string, context)
              if (!hasRootNode && parser.rootNode) {
                result = await parser.query(string, context)
              } else if (result && !parser.rootNode) {
                backlog.push(string)
              }
            } catch (err) {
              pending--;
              return reject(err)
            }
          }

          while (backlog.length && parser.rootNode) {
            const query = backlog.shift()
            try {
              const value = await parser.query(query, context)
              if (value && parser.rootNode) {
                result = value
                break
              }
            } catch (err) {
              pending--;
              return reject(err)
            }
          }

          pending--;
          loaded++
          state.paths.pop()

          if (!parser.rootNode || '#empty' === parser.rootNode.name) {
            result = null
          }

          if ('function' === typeof opts.onload) {
            opts.onload({ pending, loaded, result, state, uri })
          }

          cachedPromise.resolve(result)
          resolve(result)
        }
      })
    })

    return promise
  }
}

module.exports = {
  createLoader
}
