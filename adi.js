const { AbstractDocument } = require('./document')
const { normalizeValue } = require('./normalize')
const SMPTETimecode = require('smpte-timecode')
const { Entity } = require('./entity')

/**
 * An extended `Document` that represents an ADI document with special
 * entity access.
 * @public
 * @memberof adi
 * @param {Document|Parser|String|ReadableStream} input
 * @param {?Object} opts
 * @example
 * const fs = require('fs')
 * const stream = fs.createReadStream('./package.xml')
 * const document = Document.from(stream)
 *
 * document.ready(() => {
 *   console.log(document.metadata)
 *   console.log(document.asset)
 * })
 */
class Document extends AbstractDocument {

  /**
   * A reference to the `Metadata` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Metadata}
   */
  static get Metadata() {
    return Metadata
  }

  /**
   * A reference to the `AMS` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {AMS}
   */
  static get AMS() {
    return AMS
  }

  /**
   * A reference to the `AppData` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {AppData}
   */
  static get AppData() {
    return AppData
  }

  /**
   * A reference to the `Content` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {}
   */
  static get Content() {
    return Content
  }

  /**
   * A reference to the `Asset` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {}
   */
  static get Asset() {
    return Asset
  }

  /**
   * The document node name.
   * @public
   * @static
   * @accessor
   * @type {String}
   */
  static get nodeName() {
    return 'adi'
  }

  /**
   * The metadata associated with this ADI document.
   * @public
   * @accessor
   * @type {Metadata}
   */
  get metadata() {
    const result = this.query('[name ~> /^Metadata$/i]:first')
    return result ? this.constructor.Metadata.from(this, result) : null
  }

  /**
   * The main asset associated with this ADI document.
   * @public
   * @accessor
   * @type {Asset}
   */
  get asset() {
    const result = this.query('[name ~> /^Asset/i]:first')
    return result ? this.constructor.Asset.from(this, result) : null
  }
}

/**
 * A metadata entity found in ADI documents.
 * @public
 * @memberof adi
 * @param {Document} document
 * @param {ParserNode} node
 */
class Metadata extends Entity {

  /**
   * Computed AMS (Asset Management Service) for this ADI metadata.
   * @public
   * @accessor
   * @type {?AMS}
   */
  get ams() {
    const { document, node } = this
    const result = node.query('[name ~> /^AMS$/i]:first')
    return result ? document.constructor.AMS.from(document, result) : null
  }

  /**
   * Computed "App Data" for this ADI metadata. If none could be found,
   * then an empty array is given.
   * @public
   * @accessor
   * @type {Array<AppData>}
   */
  get appData() {
    const { document, node } = this
    const results = node.query('[name ~> /^App_Data$/i]')

    if (results) {
      return [].concat(results).map((r) => document.constructor.AppData.from(document, r))
    }

    return []
  }
}

/**
 * An AMS (Asset Management Service) entity found in ADI documents.
 * @public
 * @memberof adi
 * @param {Document} document
 * @param {ParserNode} node
 */
class AMS extends Entity {

  /**
   * The name of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get assetName() {
    return this.node.attributes.assetName || null
  }

  /**
   * The class of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get assetClass() {
    return this.node.attributes.assetClass || null
  }

  /**
   * The ID of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get assetId() {
    return this.node.attributes.assetId
  }

  /**
   * The creation date of the asset for this AMS metadata.
   * @public
   * @type {?Date}
   */
  get creationDate() {
    return normalizeValue(this.node.attributes.creationDate)
  }

  /**
   * The description of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get description() {
    return this.node.attributes.assetId || null
  }

  /**
   * The product name of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get product() {
    return this.node.attributes.product || null
  }

  /**
   * The provider name of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get provider() {
    return this.node.attributes.provider || null
  }

  /**
   * The provider ID of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get providerId() {
    return this.node.attributes.providerId || null
  }

  /**
   * The version major of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get versionMajor() {
    return this.node.attributes.versionMajor || null
  }

  /**
   * The version minor of the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get versionMinor() {
    return this.node.attributes.versionMinor || null
  }

  /**
   * The verb for the asset for this AMS metadata.
   * @public
   * @type {?String}
   */
  get verb() {
    return this.node.attributes.verb || null
  }
}

/**
 * An AppData entity found in ADI documents.
 * @public
 * @memberof adi
 * @param {Document} document
 * @param {ParserNode} node
 */
class AppData extends Entity {

  /**
   * The app this app data is for.
   * @public
   * @type {?String}
   */
  get app() {
    return this.node.attributes.app || null
  }

  /**
   * The name of this app data.
   * @public
   * @type {?String}
   */
  get name() {
    return this.node.attributes.name || null
  }

  /**
   * The value of this app data.
   * @public
   * @type {?String}
   */
  get value() {
    return this.node.attributes.value || null
  }

  /**
   * The start/in SMPTE timecode this app data is associated with.
   * @public
   * @type {?SMPTETimecode}
   */
  get in() {
    return normalizeValue(this.node.attributes.in)
  }

  /**
   * The stop/out SMPTE timecode this app data is associated with.
   * @public
   * @type {?SMPTETimecode}
   */
  get out() {
    return normalizeValue(this.node.attributes.out)
  }
}

/**
 * A content entity found in ADI documents.
 * @public
 * @memberof adi
 * @param {Document} document
 * @param {ParserNode} node
 */
class Content extends Entity {

  /**
   * The content value for this asset content.
   * @public
   * @accessor
   * @type {?String}
   */
  get value() {
    return this.node.attributes.value || null
  }
}

/**
 * An asset entity found in ADI documents.
 * @public
 * @memberof adi
 * @param {Document} document
 * @param {ParserNode} node
 */
class Asset extends Entity {

  /**
   * The metadata associated with this ADI asset.
   * @public
   * @accessor
   * @type {Metadata}
   */
  get metadata() {
    const { document, node } = this
    const result = node.query('[name ~> /^Metadata$/i]:first')
    return result ? document.constructor.Metadata.from(document, result) : null
  }

  /**
   * The child assets associated with this ADI asset.
   * @public
   * @accessor
   * @type {Array<Asset>}
   */
  get assets() {
    const { document, node } = this
    const results = node.query('[name ~> /^Asset/i]')

    if (results) {
      return [].concat(results).map((r) => document.constructor.Asset.from(document, r))
    }

    return []
  }

  /**
   * The content associated with this ADI asset.
   * @public
   * @accessor
   * @type {Content}
   */
  get content() {
    const { document, node } = this
    const result = node.query('[name ~> /^Content/i]:first')
    return result ? document.constructor.Content.from(document, result) : null
  }
}

/**
 * A module to provide atomic classes for working with ADI documents.
 * @public
 * @module adi
 * @see {@link https://community.cablelabs.com/wiki/plugins/servlet/cablelabs/alfresco/download?id=8f900e8b-d1eb-4834-bd26-f04bd623c3d2}
 * @example
 * const xmltv = require('mediaxml/adi')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('./package.xml')
 * const document = adi.Document.from(stream)
 *
 * document.ready(() => {
 *   console.log(document.metadata)
 *   for (const asset of document.asset.assets) {
 *     console.log(asset.metadata, asset.appData)
 *   }
 * })
 */
module.exports = {
  AMS,
  AppData,
  Asset,
  Content,
  Document,
  Metadata
}
