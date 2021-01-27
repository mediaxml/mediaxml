const { toWordsOrdinal } = require('number-to-words')

function transform(queryString) {
  const ordinals = []

  for (let i = 0; i < 10; ++i) {
    ordinals.push(toWordsOrdinal(i + 1))
  }

  for (let i = 0; i < ordinals.length; ++i) {
    queryString = queryString.replace(RegExp(`\:${ordinals[i]}`, 'g'), (ordinal, offset, source) => {
      return `[${i}]`
    })
  }

  queryString = queryString
  return queryString
    // `[-1]` will look at the tail
    .replace(RegExp(`\:last`, 'g'), `[-1]`)
    // `:{first,second,...,last} - return the nth node denoted by an ordinal
    .replace(RegExp(`^\((\:)(${ordinals.join('|')})\)`, 'i'), '$1$2')
}

module.exports = {
  transform
}
