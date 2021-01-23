The **mediaxml** module provides various implementations of XML formats
for describing media packages, manifests, and feeds such as
[RSS](#rss-guide), [mRSS](#mrss-guide), [ADI](#adi-guide),
and [XMLTV](#xmltv-guide).

### Simple Example

In the example below, we parse a [rss](#rss-guide) feed and enumerate
all of the items in the document's channel.

```js
const path = require('path')
const rss = require('mediaxml/rss')
const fs = require('fs')

const stream = fs.createReadStream('feed.rss')
const document = rss.createDocument(stream)

document.ready(() => {
  for (const item of document.channel.items) {
    console.log(item.title, item.description, item.link)
  }
})
```

### Parsing Documents

Parsing a XML document using streams:

```js
const { Parser } = require('mediaxml/parser')
const path = require('path')
const fs = require('fs')

const stream = fs.createReadStream('epg.xml')
const parser = new Parser()

stream.pipe(parser.createWriteStream()).on('finish', () => {
  console.log(parser.rootNode.sourceInfoUrl, parser.rootNode.sourceInfoName)
  console.log(parser.rootNode.children)
  parser.createReadStream().pipe(process.stdout)
})
```

#### Querying the Document Object Model

The [query](#query-guide) API is a powerful tool for querying the
document object model produced by the [parser](#parsing-documents)
using [JSONata](https://jsonata.org) query syntax with a [preprocessor
syntax](#query-preprocessor).

```js
const { rootNode } = parser

// query root node decendent nodes with tag name "channel"
const channels = rootNode.query('[name="channel"]')

// query root node decendent nodes with a tag name "programme"
const programmes = rootNode.query('[name="programme"]')

// query all nodes in document with tag name "category"
// and select the text content (selected with the `:text` preprocessor function)
const categories = rootNode.query('**[name="category"]:text')

// query all nodes in document with tag name "programme"
// an `start` attribute (selected with the `attr()` preprocessor function)
// integer value greater than todays
const programmesInFuture = rootNode.query(`[
  name = "programmes" AND
  $int(attr(start)) > $int("${Date()}")
]`)
```

### Creating Documents

```js
const { createDocument } = require('mediaxml/document')

const document = createDocument({ nodeName: 'ADI' })
const metadata = document.createChild('Metadata')

metadata.createChild('AMS', {
  Asset_Class: 'package',
  Provider_ID: 'mylifetime.com',
  Provider: 'LIFETIMEMOVIECLUB_HD_UNIFIED',
  Product: 'SVOD',
  ...
})

metadata.createChild('App_Data', {
  App: 'SVOD',
  Name: 'Metadata_Spec_Version',
  Value: 'CableLabsVOD1'
})

metadata.createChild('App_Data', {
  App: 'SVOD',
  Name: 'Provider_Content_Tier',
  Value: 'LIFETIMEMOVIECLUB_HD_UNIFIED'
})

console.log(document.toString())
// <ADI>
//   <Metadata>
//     <AMS Asset_Class="package" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-package" Asset_ID="LFHP2419582007240000" Asset_Name="LFHP2419582007240000_AMVE_HD" />
//     <App_Data App="SVOD" Name="Metadata_Spec_Version" Value="CableLabsVOD1.1" />
//     <App_Data App="SVOD" Name="Provider_Content_Tier" Value="LIFETIMEMOVIECLUB_HD_UNIFIED" />
//   </Metadata>
// </ADI>
```

### See Also

* [RSS](#rss-guide)
* [mRSS](#mrss-guide)
* [ADI](#adi-guide)
* [ADI3](#adi3-guide)
* [XMLTV](#adi3-guide)
