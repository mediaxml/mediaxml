const { Packager } = require('../../packager')
const manifest = require('./manifest')

console.log(Packager.from({ manifest }).process())
