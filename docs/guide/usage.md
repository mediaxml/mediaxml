### General Usage

The `mediaxml` module exports various APIs that allow for the parsing
and building of XML documents intended for media packaging and
metadata purposes. This includes support for metadata package specifications
like CableLabsVOD1.1 (ADI) and SCTE-236 (ADI3) as well support for feeds like
RSS, mRSS, and XMLTV. The `mediaxml` module provides low level components for
parsing and building documents in a variety of ways that make this a
convenient tool. The document object defined by `mediaxml` can be
queried with a [JSONata](https://jsonata.org) syntax extended with
special selectors

### Parsing Documents

XML documents can be parsed easily with the `Parser` class from the
`mediaxml/parser` module.

```js
const { Parser } = require('mediaxml/parser')
```

The `Parser` class can provide a `Writable` stream interface a
`Readable` stream can pipe to.

```js
const parser = new Parser()
process.stdin.pipe(parser.createWriteStream()).on('finish', () => {
  console.log(parser.rootNode)
})
```

The `Parser` instance can be directly written to.

```js
const parser = new Parser()
parser.write(source)
parser.end()
```

The static `Parser.from(input)` function can be convenient for creating
a `Parser` instance from an input string (or stream).

```js
const parser = Parser.from(source)
```

The `Parser` instance state can be serialized with the
`parser.toString()` function.

```js
const sourceString = parser.toString()
```

### Querying Document Object Model

Document nodes can be queried using ["JSONata"](https://jsonata.org) query
syntax with special selector syntax for working with `Node` (`ParserNode`)
instances represented by a document object model.

See the [`query(node, query, opts)`](#queryquery) for more
information on how the API works and how to query the node hierarchy.

Below are a few examples.

```js
// select first node in document with node name "channel"
const channel = document.query('[name="channel"]:first')
```

```js
// select the 'href' attribute value from the first child with a node name
// of "atom:link" from the first "channel" node
const atom = document.query('[name="channel"]:first:children:first[name="atom:link"]:attr(href)')
```

```js
// select the text of the first node with a name that matches the
`/^offer:BillingId$/i` regular expression
const billingId = document.query('**[name ~> /^offer:BillingId$/i]:first:text')
```

### Document & Node Building

Documents can be created easily with the `createDocument(source)` and
`createNode(name, attributes, body)` factory functions in the
`mediaxml/document` module.

```js
const { createDocument, createNode } = require('mediaxml/document')
```

Documents can be created inline from a source string or from a stream as
input.

```js
const document = createDocument(`
<package>
  <assets />
</package>
`)

console.log('%s', document)
// <package>
//   <assets />
// </package>
```

Nodes can be created easily with `createNode(name, attributes, body)`
and appended to the document with `document.appendChild(child)`

```js
document.appendChild(createNode('asset', {
  name: 'first',
  url: 'https://example.com/first.mp4'
}))

document.appendChild(createNode('asset', {
  name: 'second',
  url: 'https://example.com/second.mp4'
}))

console.log('%s', document)
// <package>
//   <assets>
//     <asset name="first" url="https://example.com/first.mp4" />
//     <asset name="second" url="https://example.com/second.mp4" />
//   </assets>
// </package>
```

Querying the nodes of the document should work as expected with the
`document.query(query)` function.

```js
const assets = document.query('**[name="asset"]')
console.log(assets) // a `ParserNodeFragment` is just a fancy `Array`
// ParserNodeFragment(2) [
//   <asset name="first" url="https://example.com/first.mp4" />,
//   <asset name="second" url="https://example.com/second.mp4" />
// ]

const urls = document.query('**[name="asset"]:attr(url)')
console.log(urls)
// [ 'https://example.com/first.mp4', 'https://example.com/second.mp4 ]
```


### Custom Documents

Custom documents can be created easily by extending the `Document` and
`Node` classes.

```js
const { Document, Node } = require('mediaxml/document')

class Channel extends Node {
  get name() {
    return this.query('[name="name"]:first:text') || null
  }
}

class CustomDocument extends Document {
  get channels() {
    const results = this.query('[name="channel"]')
    return (results ? [].concat(results) : []).map((r) => Channel.from(r))
  }
}

const document = CustomDocument.from(`
  <package>
    <channel>
      <name>Channel A</name>
    </channel>
    <channel>
      <name>Channel B</name>
    </channel>
  </package>
`)

console.log(document.channels)
console.log(document.query('channels.name'))
```
