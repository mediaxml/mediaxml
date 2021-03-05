const REGEX = /([^\$]|^|\s|\()print\s*(["|']?[a-z|A-Z|0-9|\.|_|-|\$|\(|\)|\[|\]|\s|\*]+["|']?)/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)

  function replace(_, prefix, input) {
    const result = `${prefix}$print(${input})`
    return result.replace(REGEX, replace)
  }
}

function compile() {
}

module.exports = {
  transform
}
