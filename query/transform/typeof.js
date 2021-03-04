const REGEX = /([^\$]|^|\s|\()typeof\s*(["|']?[a-z|A-Z|0-9|\.|_|-|\$|\(|\)|\[|\]|\s]+["|']?)/g

function transform(queryString) {
  return queryString.replace(REGEX, replace)
  //.replace(/([\$]+typeof)/g, '$typeof')

  function replace(_, prefix, input) {
    const result = `${prefix}$typeof(${input})`
    return result.replace(REGEX, replace)
  }
}

function compile() {
}

module.exports = {
  transform
}
