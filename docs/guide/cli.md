The `mediaxml` module ships with a command line interface program for running
queries targeted at an XML document. The program is called `mxml` and
can be invoked like `mxml <filename> <query>`. The `filename` can be a
fully qualified URL or a path to a file on disk.

### Usage

```
usage: mxml [-hiDV] [options] <filename> [query]

options:
  -h, --help      Show this message
  -i, --inspect   Show inspected output
  -D, --debug     Show debug output
  -V, --version   Show program version

arguments:
  <filename>      Path to XML file (required)
  [query]         Query in JSONata syntax on resulting model [optional]

examples:
  ## read ADI metadata
  mxml ./tvshow.xml 'adi:children[name = "Metadata"]'

  ## look for ADI3 "Movie" assets
  mxml ./movie.xml 'adi3:children[`xsi:type` = "content:MovieType"]'
```

### Examples

Query `<App_Data />` nodes that are children of the first `<Metadata />`
node in an ADI document.

```sh
$ mxml ./tvshow.xml ':root :children[name = "Metadata"]:first :children[name = "App_Data"]'
```

Query all `<title />` node text values in all `<item />` nodes in a RSS
or mRSS document.

```sh
$ mxml ./feed.rss ':root :children[name = "item"] :children[name = "title"] :text'
```

Start a [repl](#repl-mode) session with
[debug](https://github.com/visionmedia/debug) mode enabled.

```sh
$ mxml ./feed.rss --debug
mxml (feed.xml)>
```

### REPL Mode

The `mxml` command can also be used to initiate a [repl](#repl) session
for interactively querying the document object module of an XML
document.

```sh
$ mxml ./feed.rss
mxml (feed.xml)> :root:name /** query the name of the root node */
rss
query: 42.626ms
mxml (feed.xml)> $unique(**[is node]:name) /** query the name of all nodes in the document */
rss
channel
title
link
language
pubDate
lastBuildDate
managingEditor
description
image
url
height
width
atom:link
item
guid
media:category
media:content
media:title
media:description
media:thumbnail
media:credit
media:copyright
mxml (feed.xml)>
```

### See Also

* [Getting Started](#getting-started)
* [Query User Guide](#query-user-guide)
* [REPL](#repl)
