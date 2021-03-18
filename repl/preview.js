const { clearScreenDown, cursorTo, moveCursor } = require('readline')
const { getCursorPreviewPosition } = require('./utils')
const { pretty } = require('./pretty')
const truncate = require('cli-truncate')

function preview(context, result) {
  process.nextTick(() => {
    try {
      tick()
    } catch (err) {
      context.onerror(err)
    }
  })

  function tick() {
    const { server } = context
    let output = ''

    const { cursorPosition, displayPosition } = getCursorPreviewPosition(server)
    const cols = displayPosition.cols - cursorPosition.cols
    const rows = displayPosition.rows - cursorPosition.rows

    moveCursor(server.output, cols, rows)
    clearScreenDown(server.output)

    if (result) {
      output = pretty(result)

      if (output) {
        output = output
          // split the output because we'll only show a few lines
          .split('\n')
          // select as lines as there are rows available to use
          .slice(0, server.output.rows - rows - 1)
          // truncate output with a little padding
          .map((o) => truncate(o, server.output.columns - 8))

        const lines = output.length

        output = output.join('\n')

        server.output.write(`\n${output}`)
        cursorTo(server.output, cursorPosition.cols)
        moveCursor(server.output, cols, -rows - lines)
      }
    } else if (!result) {
      moveCursor(server.output, cols, rows)
      clearScreenDown(server.output)
    }
  }
}

module.exports = {
  preview
}
