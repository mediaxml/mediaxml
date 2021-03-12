const { Bindings } = require('../query/index')
const debug = require('debug')('mediaxml')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

function createCompleter(context) {
  return function completer(query) {
    try {
      const parts = query.split(':')
      const end = parts.pop()

      const completions = []
      completions.push(...[ ...context.assignments.keys() ].map((key) => `$${key}`))
      for (const key in Bindings.builtins) {
        completions.push(`$${key}(`)
      }

      if (query) {
        const pathToLoad = query.match(/\bimport\s*(['|"])?(.*)['|"]?\s*?/)
        if (pathToLoad) {
          let [, , pathspec ] = pathToLoad

          if (pathspec) {
            let hits = glob.sync(pathspec + '*')
            if (!hits || !hits.length) {
              hits = glob.sync(pathspec + '**')
            }

            for (const hit of hits) {
              const stat = fs.statSync(hit)
              if (stat.isDirectory()) {
                completions.push(query.replace(pathspec, hit + path.sep))
              } else {
                completions.push(query.replace(pathspec, hit))
              }
            }

          }
        }
      }

      if (/children:?[a-z|A-Z|-]*$/.test(query)) {
        const colon = /children:([a-z|A-Z|-]+)?$/.test(query)

        if (!colon) {
          completions.push(
            `${query}[0]`,
            `${query}[1]`,
            `${query}[2]`,
            `${query}[3]`,
            `${query}[4]`,
            `${query}[5]`,
            `${query}[6]`,
            `${query}[7]`,
            `${query}[8]`,
            `${query}[9]`
          )
        }

        completions.push(
          `${parts.join(':')}:first`,
          `${parts.join(':')}:second`,
          `${parts.join(':')}:third`,
          `${parts.join(':')}:fourth`,
          `${parts.join(':')}:fifth`,
          `${parts.join(':')}:sixth`,
          `${parts.join(':')}:seventh`,
          `${parts.join(':')}:eighth`,
          `${parts.join(':')}:ninth`,
          `${parts.join(':')}:tenth`
        )
      }

      if (!query || ':' === query || /:?r?o?o?t?/.test(query)) {
        if (!/\.$/.test(end)) {
          completions.unshift(':root')
        }
      }

      if (/\[(is|attributes|children|name|text)?\s*(.*)$/i.test(end)) {
        completions.push(
          'attributes',
          'children',
          'attr(',
          'name',
          'text',
          'import',
          'is',
          'is array',
          'is date',
          'is fragment',
          'is node',
          'is number',
          'is object',
          'is text',
          'is string',
        )
      }
      completions.push(
        'name',
        'text',
        'children',
        'attributes',
        'length'
      )

      if (/\s$/.test(query) || /(as|is)(\s.*?)$/.test(query)) {
        completions.push(...[
          'as',
          'as array',
          'as boolean',
          'as float',
          'as int',
          'as json',
          'as number',
          'as object',
          'as string',

          'as false',
          'as true',
          'as NaN',
          'as nan',
          'as null',

          'as Date',
          'as date',
          'as Document',
          'as document',
          'as Fragment',
          'as fragment',
          'as Node',
          'as node',
          'as Text',
          'as text',

          'as any',
          'as camelcase',
          'as eval',
          'as json',
          'as keys',
          'as pascalcase',
          'as query',
          'as reversed',
          'as snakecase',
          'as sorted',
          'as tuple',
          'as unique',

          'is',
          'is array',
          'is date',
          'is fragment',
          'is node',
          'is number',
          'is object',
          'is text',
          'is string',
        ].map((s) => query.replace(/\b(as|is)\b.*$/, '') + s))
      }

      completions.push(
          ':json',
          ':keys',
          ':text',

          ':attr',
          ':attrs',

          ':children',
          ':nth-child',
        )

      const hits = completions.filter((c) => {
        return c.startsWith(`:${end}`) || c.startsWith(end)
      })

      return  [
        hits.length ? unique(hits.sort()) : unique(completions.sort()),
        query
      ]
    } catch (err) {
      debug(err.stack || err)
    }

    function unique(array) {
      return Array.from(new Set(array))
    }
  }
}
module.exports = {

  createCompleter
}
