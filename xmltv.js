const { AbstractDocument } = require('./document')
const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')
const date = require('date-and-time')

const XMLTV_DATETIME_REGEX = /([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})\s?\-([0-9]+)/
const XMLTV_DATETIME_FORMAT = 'YYYYMMDDHHmmss Z'

/**
 * An extended `Document` that represents an XMLTV document with special
 * entity access.
 * @public
 * @memberof adi
 * @param {Document|Parser|String|ReadableStream} input
 * @param {?Object} opts
 * @example
 * const fs = require('fs')
 * const stream = fs.createReadStream('./epg.xml')
 * const document = Document.from(stream)
 *
 * document.ready(() => {
 *   console.log(document.channels)
 *   console.log(document.programmes)
 * })
 */
class Document extends AbstractDocument {

  /**
   * The document node name.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get nodeName() {
    return 'tv'
  }

  static get Channel() {
    return Channel
  }

  static get DisplayName() {
    return DisplayName
  }

  static get Title() {
    return Title
  }

  static get SubTitle() {
    return SubTitle
  }

  static get Description() {
    return Description
  }

  static get Category() {
    return Category
  }

  static get Language() {
    return Language
  }

  static get OriginalLanguage() {
    return OriginalLanguage
  }

  static get Icon() {
    return Icon
  }

  static get AudioDescription() {
    return AudioDescription
  }

  static get VideoDescription() {
    return VideoDescription
  }

  static get StartRating() {
    return StartRating
  }

  static get Rating() {
    return Rating
  }

  static get Credits() {
    return Credits
  }

  static get EpisodeNumber() {
    return EpisodeNumber
  }

  static get Programme() {
    return Programme
  }

  get sourceInfoURL() {
    return this.node.attributes.sourceInfoURL
  }

  get channels() {
    const results = this.query(':children [name ~> /^channel$/i]')

    if (results) {
      return [].concat(results).map((n) => this.constructor.Channel.from(this, n))
    }

    return []
  }

  get programmes() {
    const results = this.query(':children[name ~> /^programme$/i]')
    if (results) {
      return [].concat(results).map((item) => {
        return this.constructor.Programme.from(this, item)
      })
    }
  }
}

/**
 * Base class for a localizable (lang="en) entity.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class LocalizedTextEntity extends Entity {

  /**
   * The language for the text entity.
   * @public
   * @accessor
   * @type {?String}
   */
  get lang() {
    return this.node.attributes.lang || null
  }

  /**
   * The text value of this localized entity.
   * @public
   * @accessor
   * @type {?String}
   */
  get value() {
    return this.node.text || null
  }
}

class DisplayName extends LocalizedTextEntity {}
class Title extends LocalizedTextEntity {}
class SubTitle extends LocalizedTextEntity {}
class Description extends LocalizedTextEntity {}
class Category extends LocalizedTextEntity {}
class Language extends LocalizedTextEntity {}
class OriginalLanguage extends LocalizedTextEntity {}

class Icon extends Entity {
  get src() {
    return this.node.attributes.src || null
  }

  get width() {
    return normalizeValue(this.node.attributes.width)
  }

  get height() {
    return normalizeValue(this.node.attributes.height)
  }
}

class AudioDescription extends Entity {
  get stereo() {
    const result = this.node.query('[name ~> /^stereo/i]:first:text')
    return 'stereo' === result
  }
}

class VideoDescription extends Entity {
  get aspect() {
    return this.node.query('[name ~> /^aspect$/i]:first:text')
  }

  get quality() {
    return this.node.query('[name ~> /^quality$/i]:first:text')
  }
}

class StartRating extends Entity {
  get value() {
    return this.node.query('[name ~> /^value$/i]:first:text')
  }
}

class Rating extends Entity {
  get system() {
    return this.node.attributes.system || null
  }

  get value() {
    return this.node.query('[name ~> /^value$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<Icon>}
   */
  get icons() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^icon$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Icon.from(document, n)
      })
    }

    return []
  }
}

class Credits extends Entity {
  get directors() {
    const results = this.node.query('[name ~> /^director$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get actors() {
    const results = this.node.query('[name ~> /^actor$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get presenters() {
    const results = this.node.query('[name ~> /^presenter$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get producers() {
    const results = this.node.query('[name ~> /^producer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get writers() {
    const results = this.node.query('[name ~> /^writer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get adapters() {
    const results = this.node.query('[name ~> /^adapter$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get composers() {
    const results = this.node.query('[name ~> /^composer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  get editors() {
    const results = this.node.query('[name ~> /^editor$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }

  get commentators() {
    const results = this.node.query('[name ~> /^commentator$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }

  get guests() {
    const results = this.node.query('[name ~> /^guest$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }
}

class EpisodeNumber extends Entity {
  get system() {
    return this.node.attributes.system
  }

  get value() {
    return this.text
  }
}

/**
 * A channel entity found in XMLTV documents.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Channel extends Entity {

  /**
   * First computed display name for this channel.
   * @public
   * @accessor
   * @type {?DisplayName}
   */
  get displayName() {
    return this.displayNames[0] || null
  }

  /**
   * Computed display names for this channel.
   * @public
   * @accessor
   * @type {Array<DisplayName>}
   */
  get displayNames() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^display-name/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.DisplayName.from(document, n)
      })
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<Icon>}
   */
  get icons() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^icon$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Icon.from(document, n)
      })
    }

    return []
  }

  get urls() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^url/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get url() {
    return this.urls[0] || null
  }

  get id() {
    return this.node.attributes.id
  }

  get descriptions() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^desc$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Description.from(document, n)
      })
    }

    return []
  }

  get description() {
    return this.descriptions[0] || null
  }
}

class Programme extends Entity {
  get date() {
    const result = this.node.query(':children[name ~> /^date$/i]:first:text')
    if (result) {
      const [_, year, month, day] = result.match(/([0-9]{4})-?([0-9]{2})-?([0-9]{2})/)
      return new Date([year, month, day].join('-'))
    }

    return null
  }

  get start() {
    const { start } = this.node.attributes

    if (start && XMLTV_DATETIME_REGEX.test(start)) {
      return date.parse(start, XMLTV_DATETIME_FORMAT)
    } else if (start) {
      return new Date(1000 * parseInt(start))
    }

    return null
  }

  get stop() {
    const { stop } = this.node.attributes

    if (stop && XMLTV_DATETIME_REGEX.test(stop)) {
      return date.parse(stop, XMLTV_DATETIME_FORMAT)
    } else if (stop) {
      return new Date(1000 * parseInt(stop))
    }

    return null
  }

  get channel() {
    return this.node.attributes.channel
  }

  get titles() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^title$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Title.from(document, n)
      })
    }

    return []
  }

  get title() {
    return this.titles[0] || null
  }

  get subtitles() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^sub-title$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.SubTitle.from(document, n)
      })
    }

    return []
  }

  get subtitle() {
    return this.subtitles[0] || null
  }

  get descriptions() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^desc$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Description.from(document, n)
      })
    }

    return []
  }

  get description() {
    return this.descriptions[0] || null
  }

  get credits() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^credits/i]:first')

    if (result) {
      return document.constructor.Credits.from(document, result)
    }

    return null
  }

  get video() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^video/i]:first')

    if (result) {
      return document.constructor.Video.from(document, result)
    }

    return null
  }

  get rating() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^rating/i]:first')

    if (result) {
      return document.constructor.Rating.from(document, result)
    }

    return null
  }

  get countries() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^country$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get keywords() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^keyword$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get originalLanguage() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^orig-language$/i]:first')

    if (result) {
      return document.constructor.Language.from(document, result)
    }

    return null
  }

  get languages() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^language$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Language.from(document, n)
      })
    }

    return []
  }

  get language() {
    return this.languages[0] || null
  }

  /**
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<Icon>}
   */
  get icons() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^icon$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Icon.from(document, n)
      })
    }

    return []
  }

  get categories() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^category$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Category.from(document, n)
      })
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {Array<EpisodeNumber>}
   */
  get episodeNumbers() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^episode-num/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.EpisodeNumber.from(document, n)
      })
    }

    return []
  }
}

/**
 * A module to provide atomic classes for working with XMLTV documents.
 * @public
 * @module adi
 * @see {@link http://wiki.xmltv.org/index.php/XMLTVFormat}
 * @see {@link https://github.com/XMLTV/xmltv/blob/master/xmltv.dtd}
 * @example
 * const xmltv = require('mediaxml/xmltv')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('./epg.xml')
 * const document = xmltv.Document.from(stream)
 *
 * document.ready(() => {
 *   console.log(document.metadata)
 *   for (const asset of document.asset.assets) {
 *     console.log(asset.metadata, asset.appData)
 *   }
 * })
 */
module.exports = {
  Document,
}
