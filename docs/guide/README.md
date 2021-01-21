## Getting Started

```js
const path = require('path')
const rss = require('mediaxml/rss')
const fs = require('fs')

const stream = fs.createReadStream('feed.rss')
const document = rss.Document.from(stream)

document.ready(() => {
  for (const item of document.channel.items) {
    console.log(item.title, item.description, item.link)
  }
})
```

## Parsing Documents

```js
const { Parser } = require('mediaxml/parser')
const path = require('path')
const fs = require('fs')

const stream = fs.createReadStream('epg.xml')
const parser = new Parser()

stream.pipe(parser.createWriteStream()).on('finish', () => {
  console.log(parser.rootNode.sourceInfoUrl, parser.rootNode.sourceInfoName)
  console.log(parser.rootNode.children)
})
```

### Querying Data Parsed Documents

```js
const { rootNode } = parser

// query root node decendent nodes with tag name "channel"
const channels = rootNode.query('[name="channel"]')

// query root node decendent nodes with a tag name "programme"
const programmes = rootNode.query('[name="programme"]')

// query all nodes in document with tag name "category"
// and select the text content
const categories = rootNode.query('**[name="category"]:text')

// query all nodes in document with tag name "programme"
// an `start` attribute (selected with the `attr()` function)
// integer value greater than todays
const programmesInFuture = rootNode.query(`[
  name="programmes" AND
  $int(attr(start)) > $int("${Date()}")
]`)
```

## Creating Documents

```js
const { Document } = require('mediaxml/document')

const document = Document.from({ nodeName: 'ADI' })
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
