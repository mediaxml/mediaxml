const { normalizeValue } = require('../../normalize')
const { Document } = require('../../document')
const path = require('path')
const fs = require('fs')

const filename = path.resolve(__dirname, '..', 'mrss', 'feed.xml')
const document = Document.from(fs.createReadStream(filename), {
  nodeName: 'rss'
})

document.ready(() => {
  const channel = {
    ...document.query('[name="channel"]:attrs'),
    description: document.query('[name="channel"]:children [name="description"]:text'),
    items: [],
    atom: document.query('[name="channel"]:children [name="atom:link"]:attr(href)'),
    title: document.query('[name="channel"]:children [name="title"]:text'),
    link: document.query('[name="channel"]:children [name="link"]:text'),
  }

  const channelItems = document.query('[name="channel"]:children [name="item"]')

  for (const child of channelItems) {
    const description = child.query('[name="description"]:text')
    const categories = Array.from(child.query('[name="media:category"]:text'))
    const pubData = child.query('[name="pubDate"]:text')
    const title = child.query('[name="title"]:text')
    const link = child.query('[name="link"]:text')
    const contentAttributes = child.query('[name="media:content"]:attrs')
    const content = child.query('[name="media:content"]:children').reduce(reduceChildContent, { ...contentAttributes })

    const item = {
      description,
      categories,
      content,
      title,
      link,
    }

    channel.items.push(item)
  }

  console.log(channel);
})
.catch(console.error)

function reduceChild(object, child) {
  return { ...object, [child.name]: normalizeValue(child.body) }
}

function reduceChildContent(object, child) {
  const value = child.body.length
    ? normalizeValue(child.body)
    : { ...child.attributes }

  return {
    ...object,
    [child.name.replace('media:', '')]: value
  }
}
