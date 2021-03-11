mediaxml
========

> A general purpose module for working with XML that includes first
> class support for media manifests like ADI, mRSS, and SCTE-236.

## Status

> :warning: **_Under active development_**

## Installation

```sh
$ npm install mediaxml
```

## Usage

See the [Usage Guide](https://little-core-labs.github.io/mediaxml/#usage).

## API

See the [API Documentation](https://little-core-labs.github.io/mediaxml/#api).

## Getting Started

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

### Query API

Querying XML document nodes:

```js
const { createReadStream } = require('fs')
const { Document } = require('mediaxml/document')

const document = Document.from(createReadStream('file.xml'))
document.ready(() => {
  const textNodes = document.query('**[is text and is not empty]')
})
```

Query mRSS document objects:

```js
const { createReadStream } = require('fs')
const { Document } = require('mediaxml/mrss')

cont document = Document.from(createReadStream('file.rss'))
document.ready(() => {
  const items = document.query('channel.items')
  const titles = items.query('title') // items is a `Fragment` with a `query()` function
  const urls = items.query('mediaContent.url[contains "mp4"]')
})
```

### REPL

A [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) is
provided for interactive querying of data in a XML tree.

The REPL can be started by simply running the `mxml`:

```sh
$ mxml
Welcome to the MediaXML 0.2.0 CLI
Please report bugs to https://github.com/little-core-labs/mediaxml/issues
mxml(-)>
```

Importing a file can be done with the `import` keyword. This will import
an XML file into the REPL context.

```js
mxml(-)> import "./example/mrss/feed.xml"
mxml(-)> this
<rss>
  <channel>
    <title>Calm Meditation</title>
    <link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
    <language>en-us</language>
    ...
```

In the REPL, you can use the query syntax (JSONata with sugar) to query
data.

```js
mxml(-)> **[is node and text contains "amazonaws.com"] // searches all nodes with '**' wildcard operator
<link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
<link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com</link>
<url>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com/images/calmmeditationlogo_small.png</url>
<link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com/shade/</link>
<guid isPermaLink="false">http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com/shade/</guid>
<link>http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com/spectators/</link>
<guid isPermaLink="false">http://sample-firetv-web-app.s3-website-us-west-2.amazonaws.com/spectators/</guid>
```

### Documentation

See the [Official Documentation](https://little-core-labs.github.io/mediaxml) for
more information.

## See Also

  * [Media RSS Specification](https://www.rssboard.org/media-rss)
  * [CableLabs ADI 1 Specification](https://community.cablelabs.com/wiki/plugins/servlet/cablelabs/alfresco/download?id=8f900e8b-d1eb-4834-bd26-f04bd623c3d2)
  * [CableLabs ADI 1 Various Mappings](https://www.w3.org/2008/WebVideo/Annotations/drafts/ontology10/CR/mappings_tested/CableLabs1.htm)
  * [SCTE-236 - Content Metadata Specification](https://scte-cms-resource-storage.s3.amazonaws.com/ANSI_SCTE-35-2019a-1582645390859.pdf)
  * [XMLTV DTD](https://github.com/XMLTV/xmltv/blob/master/xmltv.dtd)
  * [XMLTV Format](http://wiki.xmltv.org/index.php/XMLTVFormat)

## License

MIT
