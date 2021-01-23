const { createDocument, createNode } = require('../../document')

const document = createDocument(`
<?xml version="1.0"?>
<package>
  <assets />
</package>
`)

const assets = []
assets.push(createNode('asset', {
  name: 'first',
  url: 'https://example.com/first.mp4'
}))

assets.push(createNode('asset', {
  name: 'second',
  url: 'https://example.com/second.mp4'
}))

document.query('[name="assets"]').append(...assets)

console.log(document)

const urls = document.query('**[name="asset"]:attr(url)')

console.log(urls)
