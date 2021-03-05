const REGEX = /([^\$]|^|\s|\()typeof\s*(["|']?[a-z|A-Z|0-9|\.|_|-|\$|\(|\)|\[|\]|\s]+["|']?)/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, input) {
    return compile({ prefix, input }).replace(REGEX, replace)
  }
}

function compile({ prefix, input }) {
  return `${prefix}$typeof(${input})`
}

module.exports = {
  transform
}
