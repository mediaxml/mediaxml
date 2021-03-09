const truncate = require('cli-truncate')
const chokidar = require('chokidar')
const { URL } = require('url')

async function watch() {
  if (watcher) {
    await watcher.close()
  }

  const { pathname } = new URL(filename)
  watcher = chokidar.watch(pathname)
  watcher.on('change', () => {
    console.error()
    load(filename).then(async () => {
      const { cursorPos, displayPos } = getCursorPreviewPosition(server)
      const cols = displayPos.cols - cursorPos.cols
      clearScreenDown(server.output)
      moveCursor(server.output, cols, 0)
      const query = server.line

      if (query) {
        let result = null

        try {
          result = await parser.query(query, { imports, assignments })
        } catch (err) {
          if (err && '(end)' !== err.token && !imports.pending.size) {
            throw err
          }
        }

        process.nextTick(() => {
          let output = ''

          const { cursorPos, displayPos } = getCursorPreviewPosition(server)
          const cols = displayPos.cols - cursorPos.cols
          const rows = displayPos.rows - cursorPos.rows

          if (result) {
            output = pretty(result)

            if (output) {
              output = output.split('\n').slice(0, server.output.rows - rows - 1)
              const n = output.length
              output = output
                .map((o) => `${truncate(o, server.output.columns - 8)}`)
                .join('\n')

              moveCursor(server.output, cols, rows)
              clearScreenDown(server.output)
              server.output.write(`${output}`)
              cursorTo(server.output, cursorPos.cols)
              moveCursor(server.output, cols, -rows - n -1)
            }
          } else if (!query) {
            moveCursor(server.output, cols, rows)
            clearScreenDown(server.output)
          }
        })
      }
    })
  })
}
