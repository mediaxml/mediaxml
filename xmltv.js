const { AbstractDocument } = require('./document')
const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')

/**
 * An extended `Document` that represents an XMLTV document with special
 * entity access.
 * @public
 * @memberof xmltv
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

  /**
   * A reference to the `Channel` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Channel}
   */
  static get Channel() {
    return Channel
  }

  /**
   * A reference to the `DisplayName` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {DisplayName}
   */
  static get DisplayName() {
    return DisplayName
  }

  /**
   * A reference to the `Title` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Title}
   */
  static get Title() {
    return Title
  }

  /**
   * A reference to the `SubTitle` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {SubTitle}
   */
  static get SubTitle() {
    return SubTitle
  }

  /**
   * A reference to the `Description` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Description}
   */
  static get Description() {
    return Description
  }

  /**
   * A reference to the `Category` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Category}
   */
  static get Category() {
    return Category
  }

  /**
   * A reference to the `Language` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Language}
   */
  static get Language() {
    return Language
  }

  /**
   * A reference to the `OriginalLanguage` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {OriginalLanguage}
   */
  static get OriginalLanguage() {
    return OriginalLanguage
  }

  /**
   * A reference to the `Icon` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Icon}
   */
  static get Icon() {
    return Icon
  }

  /**
   * A reference to the `AudioDescription` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {AudioDescription}
   */
  static get AudioDescription() {
    return AudioDescription
  }

  /**
   * A reference to the `VideoDescription` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {VideoDescription}
   */
  static get VideoDescription() {
    return VideoDescription
  }

  /**
   * A reference to the `StarRating` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {StarRating}
   */
  static get StarRating() {
    return StarRating
  }

  /**
   * A reference to the `Rating` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Rating}
   */
  static get Rating() {
    return Rating
  }

  /**
   * A reference to the `Credits` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Credits}
   */
  static get Credits() {
    return Credits
  }

  /**
   * A reference to the `EpisodeNumber` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {EpisodeNumber}
   */
  static get EpisodeNumber() {
    return EpisodeNumber
  }

  /**
   * A reference to the `Programme` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Programme}
   */
  static get Programme() {
    return Programme
  }

  /**
   * The `source-info-url` attribute value.
   * @public
   * @accessor
   * @type {?string}
   */
  get sourceInfoUrl() {
    return this.attributes.sourceInfoUrl || null
  }

  /**
   * The `source-info-name` attribute value.
   * @public
   * @accessor
   * @type {?string}
   */
  get sourceInfoName() {
    return this.attributes.sourceInfoName || null
  }

  /**
   * The `generator-info-url` attribute value.
   * @public
   * @accessor
   * @type {?string}
   */
  get generatorInfoUrl() {
    return this.attributes.generatorInfoUrl || null
  }

  /**
   * The `generator-info-name` attribute value.
   * @public
   * @accessor
   * @type {?string}
   */
  get generatorInfoName() {
    return this.attributes.generatorInfoName || null
  }

  /**
   * An array of all channels found in the XMLTV document.
   * @public
   * @accessor
   * @type {Array<Channel>}
   */
  get channels() {
    const results = this.query(':children [name ~> /^channel$/i]')

    if (results) {
      return [].concat(results).map((n) => this.constructor.Channel.from(this, n))
    }

    return []
  }

  /**
   * An array of all programmes found in the XMLTV document.
   * @public
   * @accessor
   * @type {Array<Programme>}
   */
  get programmes() {
    const results = this.query(':children[name ~> /^programme$/i]')

    if (results) {
      return [].concat(results).map((item) => {
        return this.constructor.Programme.from(this, item)
      })
    }

    return []
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

/**
 * A container for a display name.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class DisplayName extends LocalizedTextEntity {}

/**
 * A container for a title.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Title extends LocalizedTextEntity {}

/**
 * A container for a subtitle.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class SubTitle extends LocalizedTextEntity {}

/**
 * A container for a description.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Description extends LocalizedTextEntity {}

/**
 * A container for a category.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Category extends LocalizedTextEntity {}

/**
 * A container for a language.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Language extends LocalizedTextEntity {}

/**
 * A container for an original language.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class OriginalLanguage extends LocalizedTextEntity {}

/**
 * A container for an icon.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Icon extends Entity {

  /**
   * The source URL of the icon image.
   * @public
   * @accessor
   * @type {?String}
   */
  get src() {
    return this.node.attributes.src || null
  }

  /**
   * The width in pixels of the icon image.
   * @public
   * @accessor
   * @type {?Number}
   */
  get width() {
    return normalizeValue(this.node.attributes.width)
  }

  /**
   * The height in pixels of the icon image.
   * @public
   * @accessor
   * @type {?Number}
   */
  get height() {
    return normalizeValue(this.node.attributes.height)
  }
}

/**
 * A container for an audio description for a programme.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class AudioDescription extends Entity {

  /**
   * `true` if the audio description is "stereo"
   * @public
   * @accessor
   * @type {Boolean}
   */
  get stereo() {
    const result = this.node.query('[name ~> /^stereo$/i]:first:text')
    return 'stereo' === result
  }
}

/**
 * A container for a video description for a programme.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class VideoDescription extends Entity {

  /**
   * A string describing the aspect ratio of the programme video
   * @public
   * @accessor
   * @type {?String}
   */
  get aspect() {
    return this.node.query('[name ~> /^aspect$/i]:first:text')
  }

  /**
   * A string describing the quality of the programme video
   * @public
   * @accessor
   * @type {?String}
   */
  get quality() {
    return this.node.query('[name ~> /^quality$/i]:first:text')
  }
}

/**
 * A container for a star rating for a programme.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class StarRating extends Entity {

  /**
   * The star rating value.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.node.query('[name ~> /^value$/i]:first:text')
  }
}

/**
 * A container for a programme rating.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Rating extends Entity {

  /**
   * The rating system used to determine the rating value.
   * @public
   * @accessor
   * @type {?String}
   */
  get system() {
    return this.node.attributes.system || null
  }

  /**
   * The rating value as determined by the rating system.
   * @public
   * @accessor
   * @type {String}
   */
  get value() {
    return this.node.query('[name ~> /^value$/i]:first:text') || null
  }

  /**
   * Default (first) icon for this rating system.
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * An array of icons for this rating system.
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

/**
 * A container for programme credits such as directors, producers,
 * actor, and more.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Credits extends Entity {

  /**
   * An array of "directors" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get directors() {
    const results = this.node.query('[name ~> /^director$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "actor" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get actors() {
    const results = this.node.query('[name ~> /^actor$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "presenters" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get presenters() {
    const results = this.node.query('[name ~> /^presenter$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "producers" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get producers() {
    const results = this.node.query('[name ~> /^producer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "writers" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get writers() {
    const results = this.node.query('[name ~> /^writer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "adapters" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get adapters() {
    const results = this.node.query('[name ~> /^adapter$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "composers" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get composers() {
    const results = this.node.query('[name ~> /^composer$/i]:text')

    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "editors" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get editors() {
    const results = this.node.query('[name ~> /^editor$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "commentators" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get commentators() {
    const results = this.node.query('[name ~> /^commentator$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }

  /**
   * An array of "guests" for this credits container.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get guests() {
    const results = this.node.query('[name ~> /^guest$/i]:text')
    if (results) {
      return [].concat(results)
    }

    return []
  }
}

/**
 * A container for an episode number value and the system used
 * to determine it.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class EpisodeNumber extends Entity {

  /**
   * The episode number system used to determine
   * the episode number value.
   * @public
   * @accessor
   * @type {?String}
   */
  get system() {
    return this.node.attributes.system || null
  }

  /**
   * The episode number value
   * @public
   * @accessor
   * @type {?String}
   */
  get value() {
    return this.text || null
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
   * Default (first) icon for this channel.
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * An array of icons for this channel.
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

  /**
   * The URLs for this channel.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get urls() {
    const { node } = this
    const result = node.query(':children[name ~> /^url/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  /**
   * The default (first) URL for this channel.
   * @public
   * @accessor
   * @type {?String}
   */
  get url() {
    return this.urls[0] || null
  }

  /**
   * The ID of this channel.
   * @public
   * @accessor
   * @type {?String}
   */
  get id() {
    return this.node.attributes.id || null
  }

  /**
   * The descriptions for this programme.
   * @public
   * @accessor
   * @type {Array<Description>}
   */
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

  /**
   * The default (first) description for this programme.
   * @public
   * @accessor
   * @type {Description}
   */
  get description() {
    return this.descriptions[0] || null
  }
}

/**
 * A container for an electronic programme guide (EPG) _programme_.
 * @public
 * @memberof xmltv
 * @param {Document} document
 * @param {ParserNode} node
 */
class Programme extends Entity {

  /**
   * The possible release date and time of the programme.
   * @public
   * @accessor
   * @type {?Date}
   */
  get date() {
    const result = this.node.query(':children[name ~> /^date$/i]:first:text')
    if (result) {
      const [, year, month, day] = result.match(/([0-9]{4})-?([0-9]{2})-?([0-9]{2})/)
      return new Date([year, month, day].join('-'))
    }

    return null
  }

  /**
   * The start date and time of the programme.
   * @public
   * @accessor
   * @type {?Date}
   */
  get start() {
    const { start } = this.node.attributes

    if (start instanceof Date) {
      return start
    }

    if (start && !Number.isNaN(+start)) {
      return new Date(1000 * parseInt(start))
    }

    return null
  }

  /**
   * The stop date and time of the programme.
   * @public
   * @accessor
   * @type {?Date}
   */
  get stop() {
    const { stop } = this.node.attributes

    if (stop instanceof Date) {
      return stop
    }

    if (stop && !Number.isNaN(+stop)) {
      return new Date(1000 * parseInt(stop))
    }

    return null
  }

  /**
   * The channel id for this programme.
   * @public
   * @accessor
   * @type {Title}
   */
  get channel() {
    return this.node.attributes.channel
  }

  /**
   * The titles for this programme.
   * @public
   * @accessor
   * @type {Array<Title>}
   */
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

  /**
   * The default (first) title for this programme.
   * @public
   * @accessor
   * @type {Title}
   */
  get title() {
    return this.titles[0] || null
  }

  /**
   * The subtitles for this programme.
   * @public
   * @accessor
   * @type {Array<SubTitle>}
   */
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

  /**
   * The default (first) subtitle for this programme.
   * @public
   * @accessor
   * @type {SubTitle}
   */
  get subtitle() {
    return this.subtitles[0] || null
  }

  /**
   * The descriptions for this programme.
   * @public
   * @accessor
   * @type {Array<Description>}
   */
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

  /**
   * The default (first) description for this programme.
   * @public
   * @accessor
   * @type {Description}
   */
  get description() {
    return this.descriptions[0] || null
  }

  /**
   * The credits for this programme.
   * @public
   * @accessor
   * @type {Array<Credits>}
   */
  get credits() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^credits/i]:first')

    if (result) {
      return document.constructor.Credits.from(document, result)
    }

    return null
  }

  /**
   * The video description for this programme.
   * @public
   * @accessor
   * @type {Array<VideoDescription>}
   */
  get video() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^video/i]:first')

    if (result) {
      return document.constructor.VideoDescription.from(document, result)
    }

    return null
  }

  /**
   * The audio description for this programme.
   * @public
   * @accessor
   * @type {Array<AudioDescription>}
   */
  get audio() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^audio/i]:first')

    if (result) {
      return document.constructor.AudioDescription.from(document, result)
    }

    return null
  }

  /**
   * The rating for this programme.
   * @public
   * @accessor
   * @type {Array<Rating>}
   */
  get rating() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^rating/i]:first')

    if (result) {
      return document.constructor.Rating.from(document, result)
    }

    return null
  }

  /**
   * An array of countries for this programme.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get countries() {
    const { node } = this
    const result = node.query(':children[name ~> /^country$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  /**
   * An array of keywords for this programme.
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get keywords() {
    const { node } = this
    const result = node.query(':children[name ~> /^keyword$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  /**
   * An array of original languages for this programme.
   * @public
   * @accessor
   * @type {Array<OriginalLanguage>}
   */
  get originalLanguage() {
    const { document, node } = this
    const result = node.query(':children[name ~> /^orig-language$/i]:first')

    if (result) {
      return document.constructor.OriginalLanguage.from(document, result)
    }

    return null
  }

  /**
   * An array of languages for this programme.
   * @public
   * @accessor
   * @type {Array<Language>}
   */
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

  /**
   * Default (first) language for this programme.
   * @public
   * @accessor
   * @type {?Language}
   */
  get language() {
    return this.languages[0] || null
  }

  /**
   * Default (first) icon for this programme.
   * @public
   * @accessor
   * @type {?Icon}
   */
  get icon() {
    return this.icons[0] || null
  }

  /**
   * An array of icons for this programme.
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

  /**
   * An array of categories for this programme.
   * @public
   * @accessor
   * @type {Array<Category>}
   */
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
   * An array of episode numbers for this programme.
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
 * Factory for creating `Document` instances.
 * @public
 * @memberof xmltv
 * @return {Document}
 * @see {Document}
 */
function createDocument(...args) {
  return Document.from(...args)
}

/**
 * A module to provide atomic classes for working with XMLTV documents.
 * @public
 * @module xmltv
 * @see {@link http://wiki.xmltv.org/index.php/XMLTVFormat}
 * @see {@link https://github.com/XMLTV/xmltv/blob/master/xmltv.dtd}
 * @example
 * const xmltv = require('mediaxml/xmltv')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('./epg.xml')
 * const document = xmltv.createDocument(stream)
 *
 * document.ready(() => {
 *   console.log(document.channels)
 *   for (const programme of document.programmes) {
 *    console.log(programme.title, programme.start, programme.stop)
 *   }
 * })
 */
module.exports = {
  AudioDescription,
  Category,
  Channel,
  createDocument,
  Credits,
  Description,
  DisplayName,
  Document,
  EpisodeNumber,
  Icon,
  Language,
  LocalizedTextEntity,
  Programme,
  OriginalLanguage,
  Rating,
  StarRating,
  SubTitle,
  Title,
  VideoDescription,
}
