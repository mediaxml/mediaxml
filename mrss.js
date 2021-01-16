const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')
const rss = require('./rss')

/**
 * An extended `Document` that represents a mRSS document with special
 * entity access.
 * @class Document
 * @extends rss.Document
 * @memberof mrss
 */
class Document extends rss.Document {

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
   * A reference to the `Item` entity used by a `Document` instance.
   * @static
   * @access
   * @type {Item}
   */
  static get Item() {
    return Item
  }

  /**
   * A reference to the `MediaContent` entity used by a `Document` instance.
   * @static
   * @access
   * @type {MediaContent}
   */
  static get MediaContent() {
    return MediaContent
  }

  /**
   * A reference to the `MediaPlayer` entity used by a `Document` instance.
   * @static
   * @access
   * @type {MediaPlayer}
   */
  static get MediaPlayer() {
    return MediaPlayer
  }

  /**
   * A reference to the `MediaGroup` entity used by a `Document` instance.
   * @static
   * @access
   * @type {MediaGroup}
   */
  static get MediaGroup() {
    return MediaGroup
  }

  /**
   * An array of all channels found in the document
   * @accessor
   * @type {Array<Channel>}
   */
  get channels() {
    const channels = super.channels
    return channels
  }
}

/**
 * A channel entity found in MRSS documents.
 * @class Channel
 * @extends rss.Channel
 * @memberof mrss
 */
class Channel extends rss.Channel {

  /**
   * Computed title for this channel. Queries the first `<title />`
   * node for text value falling back to the first `<media:title />`
   * node text value.
   * @accessor
   * @type {?String}
   */
  get title() {
    return (
      super.title ||
      this.node.query(':children[name="media:title"]:first:text') ||
      null
    )
  }

  /**
   * Computed description for this channel. Queries the first `<description />`
   * node for text value falling back to the first `<media:description />`
   * node text value.
   * @accessor
   * @type {?String}
   */
  get description() {
    return (
      super.description ||
      this.node.query(':children[name="media:description"]:first:text') ||
      null
    )
  }
}

/**
 * An item entity found in MRSS documents.
 * @class Item
 * @extends rss.Item
 * @memberof mrss
 */
class Item extends rss.Item {
  get mediaContent() {
    const result = this.node.query(':children[name="media:content"]:first')
    if (result) {
      return this.document.constructor.MediaContent.from(this.document, result)
    }

    return null
  }
}

/**
 * A media group represents a grouping of media content found in an item
 * @class MediaGroup
 * @extends Entity
 * @memberof mrss
 */
class MediaGroup extends Entity {
  get mediaContent() {
  }
}

/**
 * A media content container for describing content found in an item or media group
 * @class MediaContent
 * @extends Entity
 * @memberof mrss
 */
class MediaContent extends Entity {

  /**
   * The URL of the content or a child `mediaPlayer` may contain point to a URL as well
   * @accessor
   * @type {?String}
   */
  get url() {
    const { mediaPlayer } = this
    const { url } = this.node.attributes

    if (url) {
      return url
    }

    if (mediaPlayer && mediaPlayer.url) {
      return mediaPlayer.url
    }

    return null
  }

  /**
   * The number of bytes of the content.
   * @accessor
   * @type {?Number}
   */
  get fileSize() {
    return normalizeValue(this.node.attributes.fileSize) || null
  }

  /**
   * @accessor
   * @type {?String}
   */
  get type() {
    return this.node.attributes.type || null
  }

  /**
   * @accessor
   * @type {?String}
   */
  get medium() {
    return this.node.attributes.medium || null
  }

  /**
   * @accessor
   * @type {Boolean}
   */
  get isDefault() {
    return normalizeValue(this.node.attributes.isDefault) || false
  }

  /**
   * @accessor
   * @type {?String}
   */
  get expression() {
    return this.node.attributes.expression || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get bitRate() {
    return this.bitrate
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get bitrate() {
    return normalizeValue(this.node.attributes.bitrate) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get frameRate() {
    return this.framerate
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get framerate() {
    return normalizeValue(this.node.attributes.framerate) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get samplingRate() {
    return this.samplingrate
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get samplingRate() {
    return normalizeValue(this.node.attributes.samplingrate) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get channels() {
    return normalizeValue(this.node.attributes.channels) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get duration() {
    return normalizeValue(this.node.attributes.duration) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height) || null
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width) || null
  }

  /**
   * @accessor
   * @type {?String}
   */
  get lang() {
    return this.node.attributes.lang || null
  }

  /**
   * @accessor
   * @type {MediaPlayer}
   */
  get mediaPlayer() {
    const result = this.node.query(':children[name="media:player"]:first')
    return !result ? null : this.document.constructor.MediaPlayer.from(this.document, result)
  }

  /**
   * Returns a plain JSON object of this instance.
   * @return {Object}
   */
  toJSON() {
    return {
      url: this.url,
      fileSize: this.fileSize,
      type: this.type,
      medium: this.medium,
      isDefault: this.isDefault,
      expression: this.expression,
      bitrate: this.bitrate,
      framerate: this.framerate,
      samplingrate: this.samplingrate,
      channels: this.channels,
      duration: this.duration,
      height: this.height,
      width: this.width,
      lang: this.lang,

      mediaPlayer: this.mediaPlayer,
    }
  }
}

/**
 * @class MediaPlayer
 * @extends Entity
 * @memberof mrss
 */
class MediaPlayer extends Entity {

  /**
   * The URL of the content or a child `mediaPlayer` may contain point to a URL as well
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height)
  }

  /**
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width)
  }
}

/**
 * Module exports.
 * @module mrss
 */
module.exports = {
  MediaContent,
  MediaPlayer,
  MediaGroup,
  Document,
  Channel,
  Item
}
