const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')
const mime = require('mime')
const path = require('path')
const rss = require('./rss')

/**
 * Queries and returns an array of computed keywords
 * found in `<media:keywords />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<String>}
 */
function getComputedKeywords(entity) {
  const { node } = entity
  const keywords = new Set()
  const results = []
    .concat(node.query(':children[name ~> /^media:keywords$/i]:text'))
    .filter(Boolean)

  for (const result of results) {
    if ('string' === typeof result) {
      for (const keyword of result.split(',')) {
        keyword.add(keyword.trim())
      }
    }
  }

  return Array.from(keywords)
}

/**
 * Queries and returns an array of computed comments
 * found in `<media:comments />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<String>}
 */
function getComputedComments(entity) {
  const { node } = entity
  const comments = []
  const results = []
    .concat(node.query(':children[name ~> /^media:comments$/i]:children[name ~> /^media:comment$/i]:text'))
    .filter(Boolean)

  for (const result of results) {
    if ('string' === typeof result) {
      comments.push(result.trim())
    }
  }

  return comments
}

/**
 * Queries and returns an array of computed responses
 * found in `<media:responses />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<String>}
 */
function getComputedResponses(entity) {
  const { node } = entity
  const responses = []
  const results = []
    .concat(node.query(':children[name ~> /^media:responses$/i]:children[name ~> /^media:response$/i]:text'))
    .filter(Boolean)

  for (const result of results) {
    if ('string' === typeof result) {
      responses.push(result.trim())
    }
  }

  return responses
}

/**
 * Queries and returns an array of computed backLinks
 * found in `<media:backLinks />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<String>}
 */
function getComputedBackLinks(entity) {
  const { node } = entity
  const backLinks = []
  const results = []
    .concat(node.query(':children[name ~> /^media:backLinks$/i]:children[name ~> /^media:backLink$/i]:text'))
    .filter(Boolean)

  for (const result of results) {
    if ('string' === typeof result) {
      backLinks.push(result.trim())
    }
  }

  return backLinks
}

/**
 * Queries and returns an array of computed ratings as MediaRating
 * instances found in `<media:rating />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaRating>}
 */
function getComputedRatings(entity) {
  const { document, node } = entity
  const ratings = []
  const results = []
    .concat(node.query(':children[name ~> /^media:rating$/i]'))
    .filter(Boolean)

  for (const result of results) {
    ratings.push(document.constructor.MediaRating.from(document, result))
  }

  return ratings
}

/**
 * Queries and returns an array of computed credits as MediaCredit
 * instances found in `<media:credit />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaCredit>}
 */
function getComputedCredits(entity) {
  const { document, node } = entity
  const credits = []
  const results = []
    .concat(node.query(':children[name ~> /^media:credit$/i]'))
    .filter(Boolean)

  for (const result of results) {
    credits.push(document.constructor.MediaCredit.from(document, result))
  }

  return credits
}

/**
 * Queries and returns an array of computed categories as MediaCategory
 * instances found in `<media:category />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaCategory>}
 */
function getComputedCategories(entity) {
  const { document, node } = entity
  const categories = []
  const results = []
    .concat(node.query(':children[name ~> /^media:category$/i]'))
    .filter(Boolean)

  for (const result of results) {
    categories.push(document.constructor.MediaCategory.from(document, result))
  }

  return categories
}

/**
 * Queries and returns an array of computed hashes as MediaHash
 * instances found in `<media:hash />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaHash>}
 */
function getComputedHashes(entity) {
  const { document, node } = entity
  const hashes = []
  const results = []
    .concat(node.query(':children[name ~> /^media:hash$/i]'))
    .filter(Boolean)

  for (const result of results) {
    hashes.push(document.constructor.MediaHash.from(document, result))
  }

  return hashes
}

/**
 * Queries and returns an array of computed thumbnails as MediaThumbnail
 * instances found in `<media:thumbnail />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaThumbnail>}
 */
function getComputedThumbnails(entity) {
  const { document, node } = entity
  const thumbnails = []
  const results = []
    .concat(node.query(':children[name ~> /^media:thumbnail$/i]'))
    .filter(Boolean)

  for (const result of results) {
    thumbnails.push(document.constructor.MediaThumbnail.from(document, result))
  }

  return thumbnails
}

/**
 * Queries for first `<media:title />` returning a `MediaTitle` instance.
 * @private
 * @param {Entity} entity
 * @return {MediaTitle}
 */
function getComputedMediaTitle(entity) {
  const { document, node } = entity
  const result = node.query(':children[name ~> /^media:title$/i]:first')
  return result ? document.constructor.MediaTitle.from(document, result) : null
}

/**
 * Queries for first `<media:description />` returning a `MediaDescription` instance.
 * @private
 * @param {Entity} entity
 * @return {MediaDescription}
 */
function getComputedMediaDescription(entity) {
  const { document, node } = entity
  const result = node.query(':children[name ~> /^media:description$/i]:first')
  return result ? document.constructor.MediaDescription.from(document, result) : null
}

/**
 * Queries and returns an array of computed scenes as MediaScene
 * instances found in `<media:scene />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaScene>}
 */
function getComputedScenes(entity) {
  const { document, node } = entity
  const scenes = []
  const results = []
    .concat(node.query(':children[name ~> /^media:scenes$/i]:children[name ~> /^media:scene$/i]'))
    .filter(Boolean)

  for (const result of results) {
    scenes.push(document.constructor.MediaScene.from(document, result))
  }

  return scenes
}

/**
 * Queries and returns an array of computed embeds as MediaEmbed
 * instances found in `<media:embed />` nodes.
 * @private
 * @param {Entity} entity
 * @return {Array<MediaEmbed>}
 */
function getComputedEmbeds(entity) {
  const { document, node } = entity
  const embeds = []
  const results = []
    .concat(node.query(':children[name ~> /^media:embed$/i]'))
    .filter(Boolean)

  for (const result of results) {
    embeds.push(document.constructor.MediaEmbed.from(document, result))
  }

  return embeds
}

/**
 * An extended `Document` that represents a mRSS document with special
 * entity access.
 * @public
 * @memberof mrss
 * @param {Document|Parser|String|ReadableStream} input
 * @param {?Object} opts
 */
class Document extends rss.Document {

  /**
   * A reference to the `Channel` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {Channel}
   */
  static get Channel() {
    return Channel
  }

  /**
   * A reference to the `Item` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {Item}
   */
  static get Item() {
    return Item
  }

  /**
   * A reference to the `MediaContent` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaContent}
   */
  static get MediaContent() {
    return MediaContent
  }

  /**
   * A reference to the `MediaPlayer` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaPlayer}
   */
  static get MediaPlayer() {
    return MediaPlayer
  }

  /**
   * A reference to the `MediaGroup` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaGroup}
   */
  static get MediaGroup() {
    return MediaGroup
  }

  /**
   * A reference to the `MediaRating` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaRating}
   */
  static get MediaRating() {
    return MediaRating
  }

  /**
   * A reference to the `MediaTitle` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaTitle}
   */
  static get MediaTitle() {
    return MediaTitle
  }

  /**
   * A reference to the `MediaDescription` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaDescription}
   */
  static get MediaDescription() {
    return MediaDescription
  }

  /**
   * A reference to the `MediaThumbnail` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaThumbnail}
   */
  static get MediaThumbnail() {
    return MediaThumbnail
  }

  /**
   * A reference to the `MediaCategory` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaCategory}
   */
  static get MediaCategory() {
    return MediaCategory
  }

  /**
   * A reference to the `MediaHash` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaHash}
   */
  static get MediaHash() {
    return MediaHash
  }

  /**
   * A reference to the `MediaCredit` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaCredit}
   */
  static get MediaCredit() {
    return MediaCredit
  }

  /**
   * A reference to the `MediaCopyright` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaCopyright}
   */
  static get MediaCopyright() {
    return MediaCopyright
  }

  /**
   * A reference to the `MediaText` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaText}
   */
  static get MediaText() {
    return MediaText
  }

  /**
   * A reference to the `MediaRestriction` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaRestriction}
   */
  static get MediaRestriction() {
    return MediaRestriction
  }

  /**
   * A reference to the `MediaCommunity` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaCommunity}
   */
  static get MediaCommunity() {
    return MediaCommunity
  }

  /**
   * A reference to the `MediaEmbed` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaEmbed}
   */
  static get MediaEmbed() {
    return MediaEmbed
  }

  /**
   * A reference to the `MediaEmbedParameters` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaEmbedParameters}
   */
  static get MediaEmbedParameters() {
    return MediaEmbedParameters
  }

  /**
   * A reference to the `MediaStatus` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaStatus}
   */
  static get MediaStatus() {
    return MediaStatus
  }

  /**
   * A reference to the `MediaPrice` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaPrice}
   */
  static get MediaPrice() {
    return MediaPrice
  }

  /**
   * A reference to the `MediaLicense` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaLicense}
   */
  static get MediaLicense() {
    return MediaLicense
  }

  /**
   * A reference to the `MediaSubTitle` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaSubTitle}
   */
  static get MediaSubTitle() {
    return MediaSubTitle
  }

  /**
   * A reference to the `MediaPeerLink` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaPeerLink}
   */
  static get MediaPeerLink() {
    return MediaPeerLink
  }

  /**
   * A reference to the `MediaRights` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaRights}
   */
  static get MediaRights() {
    return MediaRights
  }

  /**
   * A reference to the `MediaLocation` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaLocation}
   */
  static get MediaLocation() {
    return MediaLocation
  }

  /**
   * A reference to the `MediaScene` entity used by a `Document` instance.
   * @public
   * @static
   * @access
   * @type {MediaScene}
   */
  static get MediaScene() {
    return MediaScene
  }

  /**
   * An array of all channels found in the document
   * @public
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
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class Channel extends rss.Channel {

  /**
   * Computed title for this channel. Queries the first `<media:title />`
   * node for text value falling back to the first `<title />`
   * node text value.
   * @public
   * @accessor
   * @type {?String}
   */
  get title() {
    return (
      this.node.query(':children[name ~> /^media:title$/i]:first:text') ||
      super.title ||
      null
    )
  }

  /**
   * Computed description for this channel. Queries the first `<description />`
   * node for text value falling back to the first `<media:description />`
   * node text value.
   * @public
   * @accessor
   * @type {?String}
   */
  get description() {
    return (
      super.description ||
      this.node.query(':children[name ~> /^media:description$/i]:first:text') ||
      null
    )
  }

  /**
   * Computed media title for this channel.
   * @public
   * @accessor
   * @type {?MediaTitle}
   */
  get mediaTitle() {
    return getComputedMediaTitle(this)
  }

  /**
   * Computed media description for this channel.
   * @public
   * @accessor
   * @type {?MediaDescription}
   */
  get mediaDescription() {
    return getComputedMediaDescription(this)
  }

  /**
   * Computed keyword for this channel.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get mediaKeywords() {
    return getComputedKeywords(this)
  }

  /**
   * Computed rating for this channel.
   * @public
   * @accessor
   * @type {Array<MediaRating>}
   */
  get mediaRatings() {
    return getComputedRatings(this)
  }

  /**
   * Computed rating for this channel.
   * @public
   * @accessor
   * @type {Array<MediaCategory>}
   */
  get mediaCategories() {
    return getComputedCategories(this)
  }

  /**
   * Computed thumbnails for this channel.
   * @public
   * @accessor
   * @type {Array<MediaThumbnail>}
   */
  get mediaThumbnails() {
    return getComputedThumbnails(this)
  }

  /**
   * Computed credits for this channel.
   * @public
   * @accessor
   * @type {Array<MediaCredit>}
   */
  get mediaCredits() {
    return getComputedCredits(this)
  }

  /**
   * Computed hashes for this channel.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaHashes() {
    return getComputedHashes(this)
  }

  /**
   * Computed comments for this channel.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaComments() {
    return getComputedComments(this)
  }

  /**
   * Computed responses for this channel.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaResponses() {
    return getComputedResponses(this)
  }

  /**
   * Computed scenes for this channel.
   * @public
   * @accessor
   * @type {Array<MediaScene>}
   */
  get mediaScenes() {
    return getComputedScenes(this)
  }

  /**
   * Computed embeds for this channel.
   * @public
   * @accessor
   * @type {Array<MediaEmbed>}
   */
  get mediaEmbeds() {
    return getComputedEmbeds(this)
  }

  /**
   * Computed back links for this channel.
   * @public
   * @accessor
   * @type {Array<Media>}
   */
  get mediaBacklinks() {
    return getComputedBackLinks(this)
  }

  /**
   * Computed status for this channel.
   * @public
   * @accessor
   * @type {?MediaStatus}
   */
  get mediaStatus() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:status$/i]:first')
    return result ? document.constructor.MediaStatus.from(document, result) : null
  }

  /**
   * Computed rights for this channel.
   * @public
   * @accessor
   * @type {?MediaRights}
   */
  get mediaRights() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:rights$/i]:first')
    return result ? document.constructor.MediaRights.from(document, result) : null
  }

  /**
   * Computed price for this channel.
   * @public
   * @accessor
   * @type {?MediaPrice}
   */
  get mediaPrice() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:price$/i]:first')
    return result ? document.constructor.MediaPrice.from(document, result) : null
  }

  /**
   * Computed license for this channel.
   * @public
   * @accessor
   * @type {?MediaLicense}
   */
  get mediaLicense() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:license$/i]:first')
    return result ? document.constructor.MediaLicense.from(document, result) : null
  }

  /**
   * Computed subtitle for this channel.
   * @public
   * @accessor
   * @type {?MediaSubTitle}
   */
  get mediaSubTitle() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:subTitle$/i]:first')
    return result ? document.constructor.MediaSubTitle.from(document, result) : null
  }

  /**
   * Computed peer link for this channel.
   * @public
   * @accessor
   * @type {?MediaPeerLink}
   */
  get mediaPeerLink() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:peerLink$/i]:first')
    return result ? document.constructor.MediaPeerLink.from(document, result) : null
  }
}

/**
 * An item entity found in MRSS documents.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class Item extends rss.Item {

  /**
   * Media content category names. Will resolve computed categories
   * found in both `<category />`  and `<media:category />` elements
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get categories() {
    return super.categories.concat(this.mediaCategories.map((c) => c.name))
  }

  /**
   * Computed author for this item. Queries the first `<author />`
   * node for text value falling back to `<media:credit role="author" />`
   * @public
   * @accessor
   * @type {?String}
   */
  get author() {
    return super.author || this.node.query(`
      **[name ~> /^media:credit$/i AND attr(role)="author"]:first:text
    `)
  }

  /**
   * Media content found directly in a channel item.
   * @public
   * @accessor
   * @type {MediaContent}
   */
  get mediaContent() {
    const result = this.node.query(`
      :children[name ~> /^media:content$/i]:first
    `)

    if (result) {
      return this.document.constructor.MediaContent.from(this.document, result)
    }

    return null
  }

  /**
   * Computed media title for this channel.
   * @public
   * @accessor
   * @type {?MediaTitle}
   */
  get mediaTitle() {
    return getComputedMediaTitle(this)
  }

  /**
   * Computed media description for this channel.
   * @public
   * @accessor
   * @type {?MediaDescription}
   */
  get mediaDescription() {
    return getComputedMediaDescription(this)
  }

  /**
   * Computed keyword for this item.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get mediaKeywords() {
    return getComputedKeywords(this)
  }

  /**
   * Computed rating for this item.
   * @public
   * @accessor
   * @type {Array<MediaRating>}
   */
  get mediaRatings() {
    return getComputedRatings(this)
  }

  /**
   * Computed rating for this item.
   * @public
   * @accessor
   * @type {Array<MediaCategory>}
   */
  get mediaCategories() {
    return getComputedCategories(this)
  }

  /**
   * Computed thumbnails for this item.
   * @public
   * @accessor
   * @type {Array<MediaThumbnail>}
   */
  get mediaThumbnails() {
    return getComputedThumbnails(this)
  }

  /**
   * Computed credits for this item.
   * @public
   * @accessor
   * @type {Array<MediaCredit>}
   */
  get mediaCredits() {
    return getComputedCredits(this)
  }

  /**
   * Computed hashes for this item.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaHashes() {
    return getComputedHashes(this)
  }

  /**
   * Computed comments for this item.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaComments() {
    return getComputedComments(this)
  }

  /**
   * Computed responses for this item.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaResponses() {
    return getComputedResponses(this)
  }

  /**
   * Computed responses for this item.
   * @public
   * @accessor
   * @type {Array<MediaScene>}
   */
  get mediaScenes() {
    return getComputedScenes(this)
  }

  /**
   * Computed embeds for this item.
   * @public
   * @accessor
   * @type {Array<MediaEmbed>}
   */
  get mediaEmbeds() {
    return getComputedEmbeds(this)
  }

  /**
   * Computed back links for this item.
   * @public
   * @accessor
   * @type {Array<Media>}
   */
  get mediaBacklinks() {
    return getComputedBackLinks(this)
  }

  /**
   * Computed status for this item.
   * @public
   * @accessor
   * @type {?MediaStatus}
   */
  get mediaStatus() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:status$/i]:first')
    return result ? document.constructor.MediaStatus.from(document, result) : null
  }

  /**
   * Computed rights for this item.
   * @public
   * @accessor
   * @type {?MediaRights}
   */
  get mediaRights() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:rights$/i]:first')
    return result ? document.constructor.MediaRights.from(document, result) : null
  }

  /**
   * Computed price for this item.
   * @public
   * @accessor
   * @type {?MediaPrice}
   */
  get mediaPrice() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:price$/i]:first')
    return result ? document.constructor.MediaPrice.from(document, result) : null
  }

  /**
   * Computed license for this item.
   * @public
   * @accessor
   * @type {?MediaLicense}
   */
  get mediaLicense() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:license$/i]:first')
    return result ? document.constructor.MediaLicense.from(document, result) : null
  }

  /**
   * Computed subtitle for this item.
   * @public
   * @accessor
   * @type {?MediaSubTitle}
   */
  get mediaSubTitle() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:subTitle$/i]:first')
    return result ? document.constructor.MediaSubTitle.from(document, result) : null
  }
}

/**
 * A media group represents a grouping of media content found in an item
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaGroup extends Entity {

  /**
   * Media content items found directly in this media group.
   * @public
   * @accessor
   * @type {Array<MediaContent>}
   */
  get mediaContent() {
    const { document } = this
    const result = this.node.query(':children[name ~> /^media:content$/i]')

    if (result && !Array.isArray(result)) {
      return [document.constructor.MediaContent.from(document, result)]
    } else if (Array.isArray(result)) {
      return result.map((r) => document.constructor.MediaContent.from(document, r))
    }

    return []
  }

  /**
   * Computed media title for this media group.
   * @public
   * @accessor
   * @type {?MediaTitle}
   */
  get mediaTitle() {
    return getComputedMediaTitle(this)
  }

  /**
   * Computed media description for this channel.
   * @public
   * @accessor
   * @type {?MediaDescription}
   */
  get mediaDescription() {
    return getComputedMediaDescription(this)
  }

  /**
   * Computed keyword for this media group.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get mediaKeywords() {
    return getComputedKeywords(this)
  }

  /**
   * Computed rating for this media group.
   * @public
   * @accessor
   * @type {Array<MediaRating>}
   */
  get mediaRatings() {
    return getComputedRatings(this)
  }

  /**
   * Computed rating for this media group.
   * @public
   * @accessor
   * @type {Array<MediaCategory>}
   */
  get mediaCategories() {
    return getComputedCategories(this)
  }

  /**
   * Computed thumbnails for this media group.
   * @public
   * @accessor
   * @type {Array<MediaThumbnail>}
   */
  get mediaThumbnails() {
    return getComputedThumbnails(this)
  }

  /**
   * Computed credits for this media group.
   * @public
   * @accessor
   * @type {Array<MediaCredit>}
   */
  get mediaCredits() {
    return getComputedCredits(this)
  }

  /**
   * Computed hashes for this media group.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaHashes() {
    return getComputedHashes(this)
  }

  /**
   * Computed comments for this media group.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaComments() {
    return getComputedComments(this)
  }

  /**
   * Computed responses for this media group.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaResponses() {
    return getComputedResponses(this)
  }

  /**
   * Computed responses for this media group.
   * @public
   * @accessor
   * @type {Array<MediaScene>}
   */
  get mediaScenes() {
    return getComputedScenes(this)
  }

  /**
   * Computed embeds for this media group.
   * @public
   * @accessor
   * @type {Array<MediaEmbed>}
   */
  get mediaEmbeds() {
    return getComputedEmbeds(this)
  }

  /**
   * Computed back links for this media group.
   * @public
   * @accessor
   * @type {Array<Media>}
   */
  get mediaBacklinks() {
    return getComputedBackLinks(this)
  }

  /**
   * Computed status for this media group.
   * @public
   * @accessor
   * @type {?MediaStatus}
   */
  get mediaStatus() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:status$/i]:first')
    return result ? document.constructor.MediaStatus.from(document, result) : null
  }

  /**
   * Computed rights for this media group.
   * @public
   * @accessor
   * @type {?MediaRights}
   */
  get mediaRights() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:rights$/i]:first')
    return result ? document.constructor.MediaRights.from(document, result) : null
  }

  /**
   * Computed price for this media group.
   * @public
   * @accessor
   * @type {?MediaPrice}
   */
  get mediaPrice() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:price$/i]:first')
    return result ? document.constructor.MediaPrice.from(document, result) : null
  }

  /**
   * Computed license for this media group.
   * @public
   * @accessor
   * @type {?MediaLicense}
   */
  get mediaLicense() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:license$/i]:first')
    return result ? document.constructor.MediaLicense.from(document, result) : null
  }

  /**
   * Computed subtitle for this media group.
   * @public
   * @accessor
   * @type {?MediaSubTitle}
   */
  get mediaSubTitle() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:subTitle$/i]:first')
    return result ? document.constructor.MediaSubTitle.from(document, result) : null
  }
}

/**
 * A media content container for describing content found in an item or media group
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaContent extends Entity {

  /**
   * The URL of the content or a child `mediaPlayer` may contain point to a URL as well
   * @public
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
   * @public
   * @accessor
   * @type {?Number}
   */
  get fileSize() {
    return normalizeValue(this.node.attributes.fileSize) || null
  }

  /**
   * The MIME type of this media content. If one was not specified, then it
   * is derived from the extension of the resolved URL for this media content
   * object.
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    const { url } = this
    const extname = path.extname(url)
    const type = this.node.attributes.type || mime.getType(extname)
    return type || null
  }

  /**
   * A string representing the kind of file the media content
   * represents like an image, audio, video, document, or executable.
   * @public
   * @accessor
   * @type {?String}
   */
  get medium() {
    return this.node.attributes.medium || null
  }

  /**
   * `true` if this is the default media content appearing in a media group.
   * @public
   * @accessor
   * @type {Boolean}
   */
  get isDefault() {
    return normalizeValue(this.node.attributes.isDefault) || false
  }

  /**
   * A string used to determine if the media content is "full" or a "sample".
   * @accessor
   * @type {?String}
   */
  get expression() {
    return this.node.attributes.expression || null
  }

  /**
   * The media content bit rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get bitRate() {
    return this.bitrate
  }

  /**
   * The media content bit rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get bitrate() {
    return normalizeValue(this.node.attributes.bitrate) || null
  }

  /**
   * The media content frame rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get frameRate() {
    return this.framerate
  }

  /**
   * The media content frame rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get framerate() {
    return normalizeValue(this.node.attributes.framerate) || null
  }

  /**
   * The media content sample rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get samplingRate() {
    return this.samplingrate
  }

  /**
   * The media content sample rate.
   * @public
   * @accessor
   * @type {?Number}
   */
  get samplingrate() {
    return normalizeValue(this.node.attributes.samplingrate) || null
  }

  /**
   * The number of media content channels.
   * @public
   * @accessor
   * @type {?Number}
   */
  get channels() {
    return normalizeValue(this.node.attributes.channels) || null
  }

  /**
   * The media content duration in seconds.
   * @public
   * @accessor
   * @type {?Number}
   */
  get duration() {
    return normalizeValue(this.node.attributes.duration) || null
  }

  /**
   * The media content height.
   * @public
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height) || null
  }

  /**
   * The media content width.
   * @public
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width) || null
  }

  /**
   * The media content language
   * @public
   * @accessor
   * @type {?String}
   */
  get lang() {
    return this.node.attributes.lang || null
  }

  /**
   * The media content media player instance.
   * @public
   * @accessor
   * @type {MediaPlayer}
   */
  get mediaPlayer() {
    const result = this.node.query(':children[name ~> /^media:player$/i]:first')
    return !result ? null : this.document.constructor.MediaPlayer.from(this.document, result)
  }

  /**
   * Computed keywords for this media content.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get mediaKeywords() {
    return getComputedKeywords(this)
  }

  /**
   * Computed rating for this media content.
   * @public
   * @accessor
   * @type {Array<MediaRating>}
   */
  get mediaRatings() {
    return getComputedRatings(this)
  }

  /**
   * Computed rating for this media content.
   * @public
   * @accessor
   * @type {Array<MediaCategory>}
   */
  get mediaCategories() {
    return getComputedCategories(this)
  }

  /**
   * Computed media title for this media content.
   * @public
   * @accessor
   * @type {?MediaTitle}
   */
  get mediaTitle() {
    return getComputedMediaTitle(this)
  }

  /**
   * Computed media description for this media content.
   * @public
   * @accessor
   * @type {?MediaDescription}
   */
  get mediaDescription() {
    return getComputedMediaDescription(this)
  }

  /**
   * Computed thumbnails for this media content.
   * @public
   * @accessor
   * @type {Array<MediaThumbnail>}
   */
  get mediaThumbnails() {
    return getComputedThumbnails(this)
  }

  /**
   * Computed credits for this media content.
   * @public
   * @accessor
   * @type {Array<MediaCredit>}
   */
  get mediaCredits() {
    return getComputedCredits(this)
  }

  /**
   * Computed hashes for this media content.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaHashes() {
    return getComputedHashes(this)
  }

  /**
   * Computed comments for this media content.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaComments() {
    return getComputedComments(this)
  }

  /**
   * Computed responses for this media content.
   * @public
   * @accessor
   * @type {Array<MediaHash>}
   */
  get mediaResponses() {
    return getComputedResponses(this)
  }

  /**
   * Computed responses for this media content.
   * @public
   * @accessor
   * @type {Array<MediaScene>}
   */
  get mediaScenes() {
    return getComputedScenes(this)
  }

  /**
   * Computed embeds for this media content.
   * @public
   * @accessor
   * @type {Array<MediaEmbed>}
   */
  get mediaEmbeds() {
    return getComputedEmbeds(this)
  }

  /**
   * Computed back links for this media content.
   * @public
   * @accessor
   * @type {Array<Media>}
   */
  get mediaBacklinks() {
    return getComputedBackLinks(this)
  }

  /**
   * Computed status for this media content.
   * @public
   * @accessor
   * @type {?MediaStatus}
   */
  get mediaStatus() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:status$/i]:first')
    return result ? document.constructor.MediaStatus.from(document, result) : null
  }

  /**
   * Computed rights for this media content.
   * @public
   * @accessor
   * @type {?MediaRights}
   */
  get mediaRights() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:rights$/i]:first')
    return result ? document.constructor.MediaRights.from(document, result) : null
  }

  /**
   * Computed price for this media content.
   * @public
   * @accessor
   * @type {?MediaPrice}
   */
  get mediaPrice() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:price$/i]:first')
    return result ? document.constructor.MediaPrice.from(document, result) : null
  }

  /**
   * Computed license for this media content.
   * @public
   * @accessor
   * @type {?MediaLicense}
   */
  get mediaLicense() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:license$/i]:first')
    return result ? document.constructor.MediaLicense.from(document, result) : null
  }

  /**
   * Computed subtitle for this media content.
   * @public
   * @accessor
   * @type {?MediaSubTitle}
   */
  get mediaSubTitle() {
    const { document } = this
    const result = this.node.query('[name ~> /^media:subTitle$/i]:first')
    return result ? document.constructor.MediaSubTitle.from(document, result) : null
  }

  /**
   * Returns a plain JSON object of this instance.
   * @public
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
 * A media player container for describing the parameters needed for
 * a media player to play or view a media content object.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaPlayer extends Entity {

  /**
   * The URL of the content or a child `mediaPlayer` may contain point to a URL as well
   * @public
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url
  }

  /**
   * The specified media player height.
   * @public
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height)
  }

  /**
   * The specified media player width.
   * @public
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width)
  }
}

/**
 * A media rating container to store the scheme and rating value.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaRating extends Entity {

  /**
   * The default media rating scheme.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_SCHEME() {
    return 'urn:simple'
  }

  /**
   * The media rating scheme that determines the rating value.
   * @public
   * @accessor
   * @type {String}
   */
  get scheme() {
    return (
      this.node.attributes.scheme ||
      this.constructor.DEFAULT_SCHEME ||
      MediaRating.DEFAULT_SCHEME ||
      null
    )
  }

  /**
   * The media rating value as determined by the rating scheme.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.text
  }
}

/**
 * A media title container to store the type and text value.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaTitle extends Entity {

  /**
   * The default media title text type.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_TYPE() {
    return 'plain'
  }

  /**
   * The type of text the title represents. Can be 'plain' or 'html'.
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    return (
      this.node.attributes.type ||
      this.constructor.DEFAULT_TYPE ||
      MediaTitle.DEFAULT_TYPE ||
      null
    )
  }
}

/**
 * A media description container to store the type and text value.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaDescription extends Entity {

  /**
   * The default media description text type.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_TYPE() {
    return 'plain'
  }

  /**
   * The type of text the description represents. Can be 'plain' or 'html'.
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    return (
      this.node.attributes.type ||
      this.constructor.DEFAULT_TYPE ||
      MediaDescription.DEFAULT_TYPE ||
      null
    )
  }
}

/**
 * A media thumbnail container to store the image width, height, url and
 * a NPT (Normal Play Time) timecode that corresponds to the media content
 * this thumbnail is associated with.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaThumbnail extends rss.Image {

  /**
   * The NTP timecode this thumbnail may correspond to in relation to
   * a media content object.
   * @public
   * @accessor
   * @type {?Number}
   * @see {@link https://github.com/little-core-labs/npt-timecode}
   */
  get time() {
    return normalizeValue(this.node.attributes.time)
  }
}

/**
 * A media category container to store the category scheme and label
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaCategory extends rss.Category {

  /**
   * The default media category scheme.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_SCHEME() {
    return 'http://search.yahoo.com/mrss/category_schema'
  }

  /**
   * The media category scheme that determines the category value.
   * @public
   * @accessor
   * @type {String}
   */
  get scheme() {
    return (
      this.node.attributes.scheme ||
      this.constructor.DEFAULT_SCHEME ||
      MediaCategory.DEFAULT_SCHEME ||
      null
    )
  }

  /**
   * The media category value as determined by the category scheme.
   * This value is either the `label` attribute or the node body text.
   * @public
   * @accessor
   * @type {String}
   */
  get label() {
    return this.node.attributes.label || this.node.body
  }

  /**
   * Computed name for this category falling back to the category label.
   * @public
   * @accessor
   * @type {String}
   */
  get name() {
    return super.name || this.label
  }
}

/**
 * A media hash container to store the hash algorithm and value.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaHash extends Entity {

  /**
   * The default media hash algorithm.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_ALGO() {
    return 'md5'
  }

  /**
   * The media hash algorithm that determines the hash value.
   * @public
   * @accessor
   * @type {String}
   */
  get algo() {
    return this.node.attributes.algo || null
  }

  /**
   * The media hash value as determined by the media hash algorithm.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.text
  }
}

/**
 * A media credit container to store the credit scheme, role, and value.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaCredit extends Entity {

  /**
   * The default media credit scheme.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_SCHEME() {
    return 'urn:ebu'
  }

  /**
   * The media credit scheme that determines the credit value.
   * @public
   * @accessor
   * @type {String}
   */
  get scheme() {
    return (
      this.node.attributes.scheme ||
      this.constructor.DEFAULT_SCHEME ||
      MediaCredit.DEFAULT_SCHEME ||
      null
    )
  }

  /**
   * The media credit role
   * @public
   * @accessor
   * @type {String}
   */
  get role() {
    return this.node.attributes.role || null
  }

  /**
   * The media credit value.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.text
  }
}

/**
 * A container for media copyright information.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaCopyright extends Entity {

  /**
   * The url for the copyright terms
   * @public
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url || null
  }
}

/**
 * A container for transcript text.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaText extends Entity {

  /**
   * The default media text type.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get DEFAULT_TYPE() {
    return 'plain'
  }

  /**
   * The media text type.
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    return (
      this.node.attributes.type ||
      this.constructor.DEFAULT_TYPE ||
      MediaText.DEFAULT_TYPE ||
      null
    )
  }

  /**
   * The media text language.
   * @public
   * @accessor
   * @type {?String}
   */
  get lang() {
    return this.node.attributes.lang || null
  }

  /**
   * The NPT (normal play time) start timecode this text is associated with.
   * @public
   * @accessor
   * @type {?npt.Timecode}
   * @see {@link https://github.com/little-core-labs/npt-timecode}
   * @see {@link https://www.ietf.org/rfc/rfc2326.txt}
   */
  get start() {
    return normalizeValue(this.node.attributes.start)
  }

  /**
   * The NPT (normal play time) stop/end timecode this text is associated with.
   * @public
   * @accessor
   * @type {?npt.Timecode}
   * @see {@link https://github.com/little-core-labs/npt-timecode}
   * @see {@link https://www.ietf.org/rfc/rfc2326.txt}
   */
  get end() {
    return normalizeValue(this.node.attributes.end)
  }

  /**
   * The text contents value.
   * @public
   * @accessor
   * @type {?Number}
   * @see {@link https://github.com/little-core-labs/npt-timecode}
   * @see {@link https://www.ietf.org/rfc/rfc2326.txt}
   */
  get value() {
    return this.text
  }
}

/**
 * A container for a media restriction.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaRestriction extends Entity {

  /**
   * The relationship of the restriction describes such as
   * "allow" or "deny"
   * @public
   * @accessor
   * @type {String}
   */
  get relationship() {
    return this.node.attributes.relationship || null
  }

  /**
   * The type of the restriction describes such "country" or "uri".
   * @public
   * @accessor
   * @type {String}
   */
  get type() {
    return this.node.attributes.type || null
  }

  /**
   * The text contents value of the restriction.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.text
  }
}

/**
 * A container for media community information such as star ratings,
 * statistics, and tags.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaCommunity extends Entity {

  /**
   * An object describing the star rating attributes.
   * @public
   * @accessor
   * @type {?Object}
   */
  get starRating() {
    return this.node.query('[name ~> /^media:starRating$/i]:first:attrs')
  }

  /**
   * An object describing various statistic attributes.
   * @public
   * @accessor
   * @type {?Object}
   */
  get statistics() {
    return this.node.query('[name ~> /^media:statistics$/i]:first:attrs')
  }

  /**
   * An array of possible tag values.
   * @public
   * @accessor
   * @type {?Array<String>}
   */
  get tags() {
    const result = this.node.query('[name ~> /^media:tags$/i]:text')
    const split = (r) => r.split(',')
    const trim = (r) => r.timtr()

    if (result && 'string' === typeof result) {
      return split(result).map(trim)
    } else if (Array.isArray(result)) {
      return result.map(result).map(trim)
    }

    return []
  }
}

/**
 * A media container for embedded media.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaEmbed extends Entity {

  /**
   * The URL of the embedded media.
   * @public
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.node.attributes.url
  }

  /**
   * The media embed height.
   * @public
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height) || null
  }

  /**
   * The media embed width.
   * @public
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width) || null
  }

  /**
   * The media embed params
   * @public
   * @accessor
   * @type {?MediaEmbedParameters}
  */
  get params() {
    const { document, node } = this
    const result = node.query('[name ~> /^media:param$/i]:first')
    return !result ? null : document.constructor.MediaEmbedParameters.from(document, result)
  }
}

/**
 * A container for reading media embed parameters.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaEmbedParameters extends Entity {

  /**
   * Queries for the text contents of a media embed params
   * that is the value for the named parameter.
   * @return {?Mixed}
   */
  get(key) {
    return normalizeValue(this.node.query(`
      [name ~> /^media:params$/i AND attr(name)="${key}"]:text
    `))
  }
}

/**
 * A container for describing media status.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaStatus extends Entity {

  /**
   * Describes the media status state such as "blocked" or "deleted".
   * @public
   * @accessor
   * @type {String}
   */
  get state() {
    return this.node.attributes.state
  }

  /**
   * Describes the media status reason for the state. It can be plain text or a URL.
   * @public
   * @accessor
   * @type {String}
   */
  get reason() {
    return this.node.attributes.reason
  }
}

/**
 * A container for describing the price of media content.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaPrice extends Entity {

  /**
   * The price type such as: "rent", "purchase", "package" or "subscription".
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    return this.node.attributes.type
  }

  /**
   * Describes if the price is for a "package" or "subscription".
   * @public
   * @accessor
   * @type {String}
   */
  get info() {
    return this.node.attributes.info
  }

  /**
   * The actual price.
   * @public
   * @accessor
   * @type {Number}
   */
  get price() {
    return parseFloat(this.node.attributes.price)
  }

  /**
   * The currency of the price.
   * @public
   * @accessor
   * @type {String}
   */
  get currency() {
    return this.node.attributes.currency
  }
}

/**
 * A container for a media license backed by a URL.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaLicense extends Entity {

  /**
   * The content type where the license lives at the href.
   * @public
   * @accessor
   * @type {String}
   */
  get type() {
    return this.node.attributes.type
  }

  /**
   * The URL to the license.
   * @public
   * @accessor
   * @type {String}
   */
  get href() {
    return this.node.attributes.href
  }

  /**
   * The human readable license name.
   * @public
   * @accessor
   * @type {String}
   */
  get label() {
    return this.text
  }
}

/**
 * A container for a subtitle file.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaSubTitle extends Entity {

  /**
   * The content type of the subtitle fie.
   * @public
   * @accessor
   * @type {String}
   */
  get type() {
    return this.node.attributes.type
  }

  /**
   * The URL of the subtitle tile.
   * @public
   * @accessor
   * @type {String}
   */
  get href() {
    return this.node.attributes.href
  }

  /**
   * The language the subtitles are in.
   * @public
   * @accessor
   * @type {String}
   */
  get lang() {
    return this.node.attributes.lang
  }
}

/**
 * A container for a peerlink.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaPeerLink extends Entity {

  /**
   * The peer link type, such as: "application/x-bittorrent".
   * @public
   * @accessor
   * @type {String}
   */
  get type() {
    return this.node.attributes.type
  }

  /**
   * The URL of the peer link.
   * @public
   * @accessor
   * @type {String}
   */
  get href() {
    return this.node.attributes.href
  }
}

/**
 * A container for media rights.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaRights extends Entity {

  /**
   * The status value of the media rights, such as: "userCreated" or "official".
   * @public
   * @accessor
   * @type {String}
   */
  get status() {
    return this.node.attributes.status
  }
}

/**
 * A container for media location data.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaLocation extends Entity {

  /**
   * The description of the location.
   * @public
   * @accessor
   * @type {String}
   */
  get description() {
    return this.node.attributes.description
  }

  /**
   * The NPT (normal play time) start time code.
   * @public
   * @accessor
   * @type {npt.Timecode}
   */
  get start() {
    return normalizeValue(this.node.attributes.start)
  }

  /**
   * The NPT (normal play time) stop time code.
   * @public
   * @accessor
   * @type {npt.Timecode}
   */
  get end() {
    return normalizeValue(this.node.attributes.end)
  }

  /**
   * A reference to the `<georss:where />` node.
   * @public
   * @accessor
   * @type {?ParserNode}
   */
  get georss() {
    return this.node.query('[name ~> /^georss:where$/i]')
  }
}

/**
 * A container for a media scene.
 * @public
 * @memberof mrss
 * @param {Document} document
 * @param {ParserNode} node
 */
class MediaScene extends Entity {

  /**
   * The media scene title.
   * @public
   * @accessor
   * @type {String}
   */
  get title() {
    return this.node.query('[name ~> /^sceneTitle$/i]:first:text')
  }

  /**
   * The media scene description.
   * @public
   * @accessor
   * @type {String}
   */
  get description() {
    return this.node.query('[name ~> /^sceneDescription$/i]:first:text')
  }

  /**
   * The NPT (normal play time) start time code.
   * @public
   * @accessor
   * @type {npt.Timecode}
   */
  get startTime() {
    return normalizeValue(this.node.query('[name ~> /^sceneStartTime$/i]:first:text'))
  }

  /**
   * The NPT (normal play time) end time code.
   * @public
   * @accessor
   * @type {String}
   */
  get endTime() {
    return normalizeValue(this.node.query('[name ~> /^sceneEndTime$/i]:first:text'))
  }
}

/**
 * Factory for creating `Document` instances.
 * @public
 * @memberof mrss
 * @return {Document}
 * @see {Document}
 */
function createDocument(...args) {
  return Document.from(...args)
}

/**
 * A module to provide atomic classes for working with mRSS documents.
 * @public
 * @module mrss
 * @see {@link https://www.rssboard.org/media-rss}
 * @example
 * const mrss = require('mediaxml/mrss')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('./feed.rss')
 * const document = mrss.createDocument(stream)
 *
 * document.ready(() => {
 *   const { channel } = document
 *   console.log(channel.name, channel.description)
 *   for (const item of channel.items) {
 *     console.log(item.mediaContent)
 *   }
 * })
 */
module.exports = {
  Channel,
  createDocument,
  Document,
  Item,

  MediaCredit,
  MediaCategory,
  MediaContent,
  MediaCommunity,
  MediaCopyright,

  MediaDescription,

  MediaGroup,

  MediaEmbed,
  MediaEmbedParameters,
  MediaHash,

  MediaLicense,
  MediaLocation,

  MediaPeerLink,
  MediaPlayer,
  MediaPrice,

  MediaRating,
  MediaRestriction,
  MediaRights,

  MediaScene,
  MediaStatus,
  MediaSubTitle,

  MediaText,
  MediaTitle,
  MediaThumbnail,
}
