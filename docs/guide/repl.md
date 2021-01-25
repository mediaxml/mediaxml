The `mediaxml` module ships with a command line program that provides a
[repl](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
for interactive sessions to explore the contents of an XML file and its
corresponding node hierarchy.

To start a session, simply run the `mxml` command specifying a
`filename`. The `filename` can be a fully qualified URL, or a relative
path to a file. The file is loaded and parsed before the session is
started.

Debug output can be enabled with the `--debug` flag upon starting that
program.

Starting a new session should look like:

```sh
$ mxml feed.rss
mxml (feed.xml)>
```

The smallest query we can run is the `:root` query (or `$` in _JSONata_
syntax) which should yield the root of the document.

```sh
mxml (feed.xml)> :root
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
  <channel>
    <title>Calm Meditation</title>
    ...
```

The attributes of the root node can be queried with the `:attr`
selector.

```sh
mxml (feed.xml)> :root:attr
ParserNodeAttributes {
  'xmlns:atom': 'http://www.w3.org/2005/Atom',
  'xmlns:media': 'http://search.yahoo.com/mrss/',
  version: 2
}
query: 9.114ms
```

An attribute value can be queried by specifying the name of the
attribute as an argument to the `:attr(name)` selector.

```sh
mxml (feed.xml)> :root:attr(xmlns:media)
http://search.yahoo.com/mrss/
query: 41.854ms
mxml (feed.xml)> :root:attr(xmlns:atom)
http://www.w3.org/2005/Atom
query: 3.631ms
mxml (feed.xml)> :root:attr(version)
2
query: 4.891ms
```
