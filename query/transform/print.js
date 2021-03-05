const REGEX = /([^\$]|^|\s|\()print\s*(["|']?[a-z|A-Z|0-9|\.|_|-|\$|\(|\)|\[|\]|\s|\*]+["|']?)/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, input) {
    return compile({ prefix, input })
  }
}

function compile({ prefix, input }) {
  return `${prefix}$print(${input})`
}

module.exports = {
  transform
}
