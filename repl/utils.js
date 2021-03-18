// borrowed from: https://github.com/nodejs/node/blob/master/lib/internal/repl/utils.js
function getCursorPreviewPosition(server) {
  const displayPosition = server._getDisplayPos(`${server._prompt}${server.line}`)
  const cursorPosition = server.line.length !== server.cursor
    ? server.getCursorPos()
    : displayPosition
  return { displayPosition, cursorPosition }
}

module.exports = {
  getCursorPreviewPosition
}
