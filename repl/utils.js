// borrowed from: https://github.com/nodejs/node/blob/master/lib/internal/repl/utils.js
function getCursorPreviewPosition(server) {
  const displayPos = server._getDisplayPos(`${server._prompt}${server.line}`)
  const cursorPos = server.line.length !== server.cursor
    ? server.getCursorPos()
    : displayPos
  return { displayPos, cursorPos }
}

module.exports = {
  getCursorPreviewPosition
}
