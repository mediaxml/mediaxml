const { AbstractDocument } = require('./document')
const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')
const assert = require('nanoassert')

/**
 * An extended `Document` that represents a RSS document with special
 * entity access.
 * @class Document
 * @extends AbstractDocument
 * @name Document
 * @memberof rss
 */
class Document extends AbstractDocument {

  /**
   * A reference to the `Enclosure` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Enclosure}
   */
  static get Enclosure() {
    return Enclosure
  }

  /**
   * A reference to the `TextInput` entity used by a `Document` instance.
   * @static
   * @access
   * @type {TextInput}
   */
  static get TextInput() {
    return TextInput
  }

  /**
   * A reference to the `Category` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Category}
   */
  static get Category() {
    return Category
  }

  /**
   * A reference to the `Channel` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Channel}
   */
  static get Channel() {
    return Channel
  }

  /**
   * A reference to the `Source` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Source}
   */
  static get Source() {
    return Source
  }

  /**
   * A reference to the `Image` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Image}
   */
  static get Image() {
    return Image
  }

  /**
   * A reference to the `Item` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Item}
   */
  static get Item() {
    return Item
  }

  /**
   * The document node name.
   * @static
   * @accessor
   * @type {String}
   */
  static get nodeName() {
    return 'rss'
  }

  /**
   * An array of all channels found in the RSS document. There should only
   * ever be one, but..
   * @accessor
   * @type {Array<Channel>}
   */
  get channels() {
    const result = this.query(':children [name="channel"]')
    if (Array.isArray(result)) {
      return result.map((node) => this.constructor.Channel.from(this, node))
    } else if (result) {
      return [this.constructor.Channel.from(this, result)]
    } else {
      return []
    }
  }

  /**
   * The channel found in the RSS document.
   * @accessor
   * @type {Channel}
   */
  get channel() {
    return this.channels[0] || null
  }
}

/**
 * A channel entity found in RSS documents.
 * @class Channel
 * @extends Entity
 * @memberof rss
 */
class Channel extends Entity {

  /**
   * Computed title for this channel. Queries the first `<title />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get title() {
    return this.node.query(':children[name="title"]:first:text')
  }

  /**
   * Computed link for this channel. Queries the first `<link />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get link() {
    return this.node.query(':children[name="link"]:first:text')
  }

  /**
   * Computed description for this channel. Queries the first `<description />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get description() {
    return this.node.query(':children[name="description"]:first:text')
  }

  /**
   * Computed language for this channel. Queries the first `<language />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get language() {
    return this.languages[0] || null
  }

  /**
   * Computed languages for this channel. Queries the all `<language />`
   * nodes for text values.
   * @accessor
   * @type {?String}
   */
  get languages() {
    const result = this.node.query(':children[name="language"]:text')
    return result ? [].concat(result) : []
  }

  /**
   * Computed copyright for this channel. Queries the first `<copyright />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get copyright() {
    return this.node.query(':children[name="copyright"]:first:text')
  }

  /**
   * Computed managingEditor for this channel. Queries the first `<managingEditor />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get managingEditor() {
    return this.node.query(':children[name="managingEditor"]:first:text')
  }

  /**
   * Computed webMaster for this channel. Queries the first `<webMaster />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get webMaster() {
    return this.node.query(':children[name="webMaster"]:first:text')
  }

  /**
   * Computed pubDate for this channel. Queries the first `<pubDate />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get pubDate() {
    return new Date(this.node.query(':children[name="pubDate"]:first:text'))
  }

  /**
   * Computed lastBuildDate for this channel. Queries the first `<lastBuildDate />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get lastBuildDate() {
    return new Date(this.node.query(':children[name="lastBuildDate"]:first:text'))
  }

  /**
   * Computed category for this channel. Queries the first `<category />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get category() {
    return this.categories[0] || null
  }

  /**
   * Computed categories for this channel. Queries the all `<category />`
   * nodes for text values.
   * @accessor
   * @type {?String}
   */
  get categories() {
    const result = this.node.query(':children[name="category"]:text')
    return !result ? [] : [].concat(result).map((category) => {
      return this.document.constructor.Category.from(this.document, category)
    })
  }

  /**
   * Computed generator for this channel. Queries the first `<generator />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get generator() {
    return this.node.query(':children[name="generator"]:first:text')
  }

  /**
   * Computed docs for this channel. Queries the first `<docs />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get docs() {
    return this.node.query(':children[name="docs"]:first:text')
  }

  /**
   * Computed cloud for this channel. Queries the first `<cloud />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get cloud() {
    return this.node.query(':children[name="cloud"]:first:attrs')
  }

  /**
   * Computed ttl for this channel. Queries the first `<ttl />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get ttl() {
    return normalizeValue(this.node.query(':children[name="ttl"]:first:text'))
  }

  /**
   * Computed image for this channel.
   * @accessor
   * @type {?String}
   */
  get image() {
    const result = this.node.query(':children[name="image"]:first')
    return !result ? null : this.document.constructor.Image.from(this.document, result)
  }

  /**
   * Computed images for this channel. Queries all `<image />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get images() {
    const result = this.node.query(':children[name="image"]')
    return !result ? [] : [].concat(result).map((image) => {
      return this.document.constructor.Image.from(this.document, image)
    })
  }

  /**
   * Computed textInput for this channel. Queries the first `<textInput />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get textInput() {
    const result = this.node.query(':children[name="textInput"]:first')
    return result ? new TextInput(result) : null
  }

  /**
   * Computed skipHours for this channel. Queries the first `<skipHours />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get skipHours() {
    const result = this.node.query(':children[name="skipHours"]:children[name="hour"]:text')
    return (Array.isArray(result) ? result : [result])
      .filter(Boolean)
      .map(normalizeValue)
  }

  /**
   * Computed skipDays for this channel. Queries the first `<skipDays />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get skipDays() {
    const result = this.node.query(':children[name="skipDays"]:children[name="day"]:text')
    return (Array.isArray(result) ? result : [result]).filter(Boolean)
  }

  /**
   * Computed atom:link for this channel. Queries the first `<atom:link />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get atomLink() {
    return this.node.query(':children[name="atom:link"]:first:attr(href)')
  }

  /**
   * Computed items for this channel.
   * @accessor
   * @type {Array<Item>}
   */
  get items() {
    const results = this.node.query(':children[name="item"]')
    return !results ? [] : [].concat(results).map((item) => {
      return this.document.constructor.Item.from(this.document, item)
    })
  }
}

/**
 * A textInput entity found in RSS documents.
 * @class TextInput
 * @extends Entity
 * @memberof rss
 */
class TextInput extends Entity {

  /**
   * Computed title for this text input. Queries the first `<title />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get title() {
    return this.node.query(':children[name="title"]:first:text')
  }

  /**
   * Computed description for this text input. Queries the first `<description />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get description() {
    return this.node.query(':children[name="description"]:first:text')
  }

  /**
   * Computed name for this text input. Queries the first `<name />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get name() {
    return this.node.query(':children[name="name"]:first:text')
  }

  /**
   * Computed link for this text input. Queries the first `<link />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get link() {
    return this.node.query(':children[name="link"]:first:text')
  }
}

/**
 * An image entity found in RSS documents.
 * @class Image
 * @extends Entity
 * @memberof rss
 */
class Image extends Entity {

  /**
   * Computed url for this image. Queries the first `<url />`
   * node for text value.
   * @accessorivate
   * @type {?String}
   */
  get url() {
    return this.node.query(':children[name="url"]:first:text')
  }

  /**
   * Computed title for this image. Queries the first `<title />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get title() {
    return this.node.query(':children[name="title"]:first:text')
  }

  /**
   * Computed link for this image. Queries the first `<link />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get link() {
    return this.node.query(':children[name="link"]:first:text')
  }

  /**
   * Computed description for this image. Queries the first `<description />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get description() {
    return this.node.query(':children[name="description"]:first:text')
  }

  /**
   * Computed width for this image. Queries the first `<width />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get width() {
    return normalizeValue(this.node.query(':children[name="width"]:first:text'))
  }

  /**
   * Computed height for this image. Queries the first `<height />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get height() {
    return normalizeValue(this.node.query(':children[name="height"]:first:text'))
  }
}

/**
 * A category entity found in RSS documents.
 * @class Category
 * @extends Entity
 * @memberof rss
 */
class Category extends Entity {

  /**
   * Computed name for this category. Queries the first `<title />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get name() {
    return this.node.query(':children[name="title"]:first:text')
  }

  /**
   * Computed domain for this category.
   * @accessor
   * @type {?String}
   */
  get domain() {
    return this.node.attributes.domain
  }

  /**
   * Converts this `Category` to a string.
   * @return {String}
   */
  toString() {
    return this.name
  }
}

/**
 * An item entity found in RSS documents.
 * @class Item
 * @extends Entity
 * @memberof rss
 */
class Item extends Entity {

  /**
   * Computed title for this item. Queries the first `<title />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get title() {
    return this.node.query(':children[name="title"]:first:text')
  }

  /**
   * Computed link for this item. Queries the first `<link />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get link() {
    return this.node.query(':children[name="link"]:first:text')
  }

  /**
   * Computed description for this item. Queries the first `<description />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get description() {
    return this.node.query(':children[name="description"]:first:text')
  }

  /**
   * Computed author for this item. Queries the first `<author />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get author() {
    return this.node.query(':children[name="author"]:first:text')
  }

  /**
   * Computed category for this channel. Queries the first `<category />`
   * node for text value.
   * @accessor
   * @type {?String}
   */
  get category() {
    return this.categories[0] || null
  }

  /**
   * Computed categories for this channel. Queries the all `<category />`
   * nodes for text values.
   * @accessor
   * @type {?String}
   */
  get categories() {
    const result = this.node.query(':children[name="category"]:text')
    return !result ? [] : [].concat(result).map((category) => {
      return this.constructor.Category.from(this.document, category)
    })
  }

  /**
   * Computed comments for this channel. Queries the all `<category />`
   * nodes for text values.
   * @accessor
   * @type {?String}
   */
  get comments() {
    const result = this.node.query(':children[name="comment"]:text')
    return result ? [].concat(result) : []
  }
}

/**
 * A source entity found in RSS documents.
 * @class Source
 * @extends Entity
 * @memberof rss
 */
class Source extends Entity {

  /**
   * Computed url for this source.
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url
  }
}

/**
 * An enclosure entity found in RSS documents.
 * @class Enclosure
 * @extends Entity
 * @memberof rss
 */
class Enclosure extends Entity {

  /**
   * Computed url for this enclosure.
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url
  }

  /**
   * Computed length for this enclosure.
   * @accessor
   * @type {?String}
   */
  get length() {
    return normalizeValue(this.node.attributes.length)
  }

  /**
   * Computed type for this enclosure.
   * @accessor
   * @type {?String}
   */
  get type() {
    return this.node.attributes.type
  }
}

/**
 * Module exports.
 * @module rss
 */
module.exports = {
  Enclosure,
  TextInput,
  Document,
  Category,
  Channel,
  Source,
  Image,
  Item
}
