const { normalizeValue } = require('./normalize')
const { Entity } = require('./entity')
const adi = require('./adi')

/**
 * An extended `Document` that represents an ADI3 document with special
 * entity access.
 * @public
 * @memberof adi3
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
class Document extends adi.Document {

  /**
   * A reference to the `Asset` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Asset}
   */
  static get Asset() {
    return Asset
  }

  /**
   * A reference to the `EncryptionInfo` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {EncryptionInfo}
   */
  static get EncryptionInfo() {
    return EncryptionInfo
  }

  /**
   * A reference to the `CopyControlInfo` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {CopyControlInfo}
   */
  static get CopyControlInfo() {
    return CopyControlInfo
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
   * A reference to the `DistributorRoyaltyInfo` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {DistributorRoyaltyInfo}
   */
  static get DistributorRoyaltyInfo() {
    return DistributorRoyaltyInfo
  }

  /**
   * A reference to the `StudioRoyaltyInfo` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {StudioRoyaltyInfo}
   */
  static get StudioRoyaltyInfo() {
    return StudioRoyaltyInfo
  }

  /**
   * A reference to the `LocalizableTitle` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {LocalizableTitle}
   */
  static get LocalizableTitle() {
    return LocalizableTitle
  }

  /**
   * A reference to the `Actor` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Actor}
   */
  static get Actor() {
    return Actor
  }

  /**
   * A reference to the `Director` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Director}
   */
  static get Director() {
    return Director
  }

  /**
   * A reference to the `Chapter` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Chapter}
   */
  static get Chapter() {
    return Chapter
  }

  /**
   * A reference to the `Presentation` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Presentation}
   */
  static get Presentation() {
    return Presentation
  }

  /**
   * A reference to the `Extension` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {Extension}
   */
  static get Extension() {
    return Extension
  }

  /**
   * A reference to the `AlternateId` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {AlternateId}
   */
  static get AlternateId() {
    return AlternateId
  }

  /**
   * A reference to the `SubscriberViewLimit` entity used by a `Document` instance.
   * @public
   * @static
   * @accessor
   * @type {SubscriberViewLimit}
   */
  static get SubscriberViewLimit() {
    return SubscriberViewLimit
  }
  /**
   *
   * The child assets associated with this ADI3 asset.
   * @public
   * @accessor
   * @type {Array<Asset>}
   */
  get assets() {
    const results = this.query('[name ~> /^Asset$/i]')

    if (results) {
      return [].concat(results).map((r) => {
        return this.constructor.Asset.from(this, r)
      })
    }

    return []
  }
}

/**
 * An asset entity found in ADI3 documents.
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Asset extends adi.Asset {

  /**
   * The asset type as determined by the `xsi:type` attribute.
   * @public
   * @accessor
   * @type {?String}
   */
  get type() {
    return this.node.attributes['xsi:type'] || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get uriId() {
    return this.node.attributes.uriId || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get providerVersionNum() {
    return this.node.attributes.providerVersionNum || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get internalVersionNum() {
    return this.node.attributes.internalVersionNum || null
  }

  /**
   * @public
   * @accessor
   * @type {?Date}
   */
  get creationDateTime() {
    return normalizeValue(this.node.attributes.creationDateTime)
  }

  /**
   * @public
   * @accessor
   * @type {?Date}
   */
  get startDateTime() {
    return normalizeValue(this.node.attributes.startDateTime)
  }

  /**
   * @public
   * @accessor
   * @type {?Date}
   */
  get endDateTime() {
    return normalizeValue(this.node.attributes.endDateTime)
  }

  /**
   * @public
   * @accessor
   * @type {Array<AlternateId>}
   */
  get alternateIds() {
    const { document, node } = this
    const result = node.query('[name ~> /^core:AlternateId$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.AlternateId.from(document, n)
      })
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get assetName() {
    return this.node.query('[name ~> /^core:AssetName$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get product() {
    return this.node.query('[name ~> /^core:Product$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get provider() {
    return this.node.query('[name ~> /^core:Provider$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get providerQAContact() {
    return this.node.query('[name ~> /^core:ProviderQAContact$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get description() {
    return this.node.query('[name ~> /^core:Description$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<Extensions>}
   */
  get extensions() {
    const { document, node } = this
    const result = node.query('[name ~> /^core:Ext$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Extension.from(document, n)
      })
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {?Presentation}
   */
  get presentation() {
    const { document, node } = this
    const result = node.query('[name ~> /^offer:Presentation$/i]:first')

    if (result) {
      return document.constructor.Presentation.from(document, result)
    }

    return null
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get promotionalContentGroupRefs() {
    const query = '[name ~> /^offer:PromotionalContentGroupRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  get providerContentTier() {
    return this.node.query('[name ~> /^offer:ProviderContentTier$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get billingId() {
    return this.node.query('[name ~> /^offer:BillingId$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get termsRefs() {
    const query = '[name ~> /^offer:TermsRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get titleRefs() {
    const query = '[name ~> /^offer:TitleRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get movieRefs() {
    const query = '[name ~> /^offer:MovieRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get previewRefs() {
    const query = '[name ~> /^offer:PreviewRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get boxCoverRefs() {
    const query = '[name ~> /^offer:BoxCoverRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get contentGroupRefs() {
    const query = '[name ~> /^offer:ContentGroupRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get masterSourceRefs() {
    const query = '[name ~> /^offer:MasterSourceRef$/i]:attr(uriId)'
    const result = this.node.query(query)
    return result ? [].concat(result) : []
  }

  /**
   * @public
   * @accessor
   * @type {?Rating}
   */
  get rating() {
    const { document, node } = this
    const result = node.query('[name ~> /^title:Rating$/i]:first')

    if (result) {
      return document.constructor.Rating.from(document, result)
    }

    return null
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get advisories() {
    const result = this.node.query('[name ~> /^title:Advisory$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get contractName() {
    return this.node.query('[name ~> /^terms:ContractName$/i]:first:text') || null
  }

  get billingGracePeriod() {
    return normalizeValue(this.node.query('[name ~> /^terms:BillingGracePeriod$/i]:first:text'))
  }

  get usagePeriod() {
    return normalizeValue(this.node.query('[name ~> /^terms:UsagePeriod$/i]:first:text'))
  }

  get homeVideoWindow() {
    return normalizeValue(this.node.query('[name ~> /^terms:HomeVideoWindow$/i]:first:text'))
  }

  get subscriberViewLimit() {
    const { document, node } = this
    const result = node.query('[name ~> /^terms:SubscriberViewLimit$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.SubscriberViewLimit.from(document, n)
      })
    }

    return []
  }

  get suggestedPrice() {
    return normalizeValue(this.node.query('[name ~> /^terms:SuggestedPrice/i]:first:text'))
  }

  get categoryPaths() {
    const result = this.node.query('[name ~> /^offer:CategoryPath$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get isClosedCaptioning() {
    return 'true' === this.node.query('[name ~> /^title:IsClosedCaptioning$/i]:text')
  }

  get isSeasonPremiere() {
    return 'true' === this.node.query('[name ~> /^title:IsSeasonPremiere$/i]:text')
  }

  get isSeasonFinale() {
    return 'true' === this.node.query('[name ~> /^title:IsSeasonFinale$/i]:text')
  }

  get isEncryptionRequired() {
    return 'true' === this.node.query('[name ~> /^title:IsEncryptionRequired$/i]:text')
  }

  get displayRunTime() {
    return this.node.query('[name ~> /^title:DisplayRunTime$/i]:first:text')
  }

  get boxOffice() {
    return this.node.query('[name ~> /^title:BoxOffice$/i]:first:text')
  }

  get programmerCallLetters() {
    return this.node.query('[name ~> /^title:ProgrammerCallLetters$/i]:first:text')
  }

  get year() {
    return this.node.query('[name ~> /^title:Year$/i]:first:text')
  }

  get countryOfOrigin() {
    return this.node.query('[name ~> /^title:CountryOfOrigin$/i]:first:text')
  }

  get genres() {
    const result = this.node.query('[name ~> /^title:Genre$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get showType() {
    return this.node.query('[name ~> /^title:ShowType$/i]:first:text')
  }

  get distributorRoyaltyInfo() {
    const { document, node } = this
    const result = node.query('[name ~> /^terms:DistributorRoyaltyInfo$/i]:first')

    if (result) {
      return document.constructor.DistributorRoyaltyInfo.from(document, result)
    }

    return null
  }

  get studioRoyaltyInfo() {
    const { document, node } = this
    const result = node.query('[name ~> /^terms:StudioRoyaltyInfo$/i]:first')

    if (result) {
      return document.constructor.StudioRoyaltyInfo.from(document, result)
    }

    return null
  }

  get sourceUrl() {
    return this.node.query('[name ~> /^content:SourceUrl$/i]:first:text') || null
  }

  get contentFileSize() {
    return normalizeValue(this.node.query('[name ~> /^content:ContentFileSize$/i]:first:text'))
  }

  get contentCheckSum() {
    return this.node.query('[name ~> /^content:ContentCheckSum$/i]:first:text') || null
  }

  get propagationPriority() {
    return normalizeValue(this.node.query('[name ~> /^content:PropagationPriority$/i]:first:text'))
  }

  get audioTypes() {
    const result = this.node.query('[name ~> /^content:AudioType$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get screenFormats() {
    const result = this.node.query('[name ~> /^content:ScreenFormat$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {?Object}
   */
  get duration() {
    return normalizeValue(this.node.query('[name ~> /^content:Duration$/i]:first:text'))
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get language() {
    return this.node.query('[name ~> /^content:Language$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get subtitleLanguages() {
    const result = this.node.query('[name ~> /^content:SubtitleLanguage$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  /**
   * @public
   * @accessor
   * @type {Array<String>}
   */
  get dubbedLanguages() {
    const result = this.node.query('[name ~> /^content:DubbedLanguage$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get xResolution() {
    return normalizeValue(this.node.query('[name ~> /^content:X_Resolution$/i]:first:text'))
  }

  get yResolution() {
    return normalizeValue(this.node.query('[name ~> /^content:y_Resolution$/i]:first:text'))
  }

  get encryptionInfo() {
    const { document, node } = this
    const result = node.query('[name ~> /^terms:EncryptionInfo$/i]:first')

    if (result) {
      return document.constructor.EncryptionInfo.from(document, result)
    }

    return null
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class SubscriberViewLimit extends Entity {
  get startDateTime() {
    return normalizeValue(this.node.attributes.startDateTime)
  }

  get endDateTime() {
    return normalizeValue(this.node.attributes.endDateTime)
  }

  get maximumViews() {
    return normalizeValue(this.node.attributes.maximumViews)
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class AlternateId extends Entity {
  get identifierSystem() {
    return this.node.attributes.identifierSystem || null
  }

  get value() {
    return this.text || bnull
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Extension extends adi.Metadata {
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class EncryptionInfo extends Entity {
  get receiverType() {
    return this.node.query('[name ~> /^content:ReceiverType$/i]:first:text') || null
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class CopyControlInfo extends Entity {
  get isCopyProtection() {
    return 'true' === this.node.query('[name ~> /^title:IsCopyProtection$/i]:text')
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Rating extends Entity {
  get system() {
    return this.node.attributes.ratingSystem || super.system
  }

  get value() {
    return this.text
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class DistributorRoyaltyInfo extends Entity {
  get organizationName() {
    return this.node.query('[name ~> /^terms:OrganizationName$/i]:first:text') || null
  }

  get royaltyPercent() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyPercent$/i]:first:text'))
  }

  get royaltyMinimum() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyMinimum$/i]:first:text'))
  }

  get royaltyFlatRate() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyFlatRate$/i]:first:text'))
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class StudioRoyaltyInfo extends Entity {
  get organizationCode() {
    return this.node.query('[name ~> /^terms:OrganizationCode$/i]:first:text') || null
  }

  get organizationName() {
    return this.node.query('[name ~> /^terms:OrganizationName$/i]:first:text') || null
  }

  get royaltyPercent() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyPercent$/i]:first:text'))
  }

  get royaltyMinimum() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyMinimum$/i]:first:text'))
  }

  get royaltyFlatRate() {
    return normalizeValue(this.node.query('[name ~> /^terms:RoyaltyFlatRate$/i]:first:text'))
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class LocalizableTitle extends Entity {
  get titleSortName() {
    return this.node.query('[name ~> /^title:TitleSortName$/i]:first:text') || null
  }

  get titleBrief() {
    return this.node.query('[name ~> /^title:TitleBrief$/i]:first:text') || null
  }

  get titleMedium() {
    return this.node.query('[name ~> /^title:TitleMedium$/i]:first:text') || null
  }

  get titleLong() {
    return this.node.query('[name ~> /^title:TitleLong$/i]:first:text') || null
  }

  get episodeName() {
    return this.node.query('[name ~> /^title:EpisodeName$/i]:first:text') || null
  }

  get episodeId() {
    return this.node.query('[name ~> /^title:EpisodeID$/i]:first:text') || null
  }

  get summaryShort() {
    return this.node.query('[name ~> /^title:SummaryShort$/i]:first:text') || null
  }

  get summaryMedium() {
    return this.node.query('[name ~> /^title:SummaryMedium$/i]:first:text') || null
  }

  get summaryLong() {
    return this.node.query('[name ~> /^title:SummaryLong$/i]:first:text') || null
  }

  get actorDisplay() {
    return this.node.query('[name ~> /^title:ActorDisplay$/i]:first:text') || null
  }

  get writerDisplay() {
    return this.node.query('[name ~> /^title:WriterDisplay$/i]:first:text') || null
  }

  get studioDisplay() {
    return this.node.query('[name ~> /^title:StudioDisplay$/i]:first:text') || null
  }

  get recordingArtists() {
    const result = this.node.query('[name ~> /^title:RecordingArtist$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get songTitles() {
    const result = this.node.query('[name ~> /^title:SongTitle$/i]:text')

    if (result) {
      return [].concat(result)
    }

    return []
  }

  get actors() {
    const { document, node } = this
    const result = node.query('[name ~> /^title:Actor$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Actor.from(document, n)
      })
    }

    return []
  }

  get directors() {
    const { document, node } = this
    const result = node.query('[name ~> /^title:Director$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Director.from(document, n)
      })
    }

    return []
  }

  get chapters() {
    const { document, node } = this
    const result = node.query('[name ~> /^title:Chapter$/i]')

    if (result) {
      return [].concat(result).map((n) => {
        return document.constructor.Chapter.from(document, n)
      })
    }

    return []
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Actor extends Entity {
  get fullName() {
    return this.node.attributes.fullName || null
  }

  get firstName() {
    return this.node.attributes.firstName || null
  }

  get lastName() {
    return this.node.attributes.lastName || null
  }

  get sortableName() {
    return this.node.attributes.sortableName || null
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Director extends Entity {
  get fullName() {
    return this.node.attributes.fullName || null
  }

  get firstName() {
    return this.node.attributes.firstName || null
  }

  get lastName() {
    return this.node.attributes.lastName || null
  }

  get sortableName() {
    return this.node.attributes.sortableName || null
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Chapter extends Entity {
  get heading() {
    return this.node.attributes.heading || null
  }

  get timeCode() {
    return normalizeValue(this.node.attributes.timeCode)
  }
}

/**
 * @public
 * @memberof adi3
 * @param {Document} document
 * @param {ParserNode} node
 */
class Presentation extends Entity {

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get categoryRef() {
    return this.node.query('[name ~> /^offer:CategoryRef$/i]:first:attr(uriId)') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get displayAsNew() {
    return this.node.query('[name ~> /^offer:DisplayAsNew$/i]:first:text') || null
  }

  /**
   * @public
   * @accessor
   * @type {?String}
   */
  get displayAsLastChance() {
    return this.node.query('[name ~> /^offer:DisplayAsLastChance$/i]:first:text') || null
  }
}

/**
 * Factory for creating `Document` instances.
 * @public
 * @memberof adi3
 * @return {Document}
 * @see {Document}
 */
function createDocument(...args) {
  return Document.from(...args)
}

/**
 * A module to provide atomic classes for working with ADI3 documents.
 * @public
 * @module adi3
 * @see {@link https://scte-cms-resource-storage.s3.amazonaws.com/ANSI_SCTE-35-2019a-1582645390859.pdf}
 * @example
 * const adi3 = require('mediaxml/adi3')
 * const fs = require('fs')
 *
 * const stream = fs.createReadStream('./package.xml')
 * const document = adi3.createDocument(stream)
 *
 * document.ready(() => {
 *   for (const asset of document.assets) {
 *   }
 * })
 */
module.exports = {
  Actor,
  AlternateId,
  Asset,
  Chapter,
  CopyControlInfo,
  createDocument,
  Director,
  DistributorRoyaltyInfo,
  Document,
  EncryptionInfo,
  Extension,
  LocalizableTitle,
  Presentation,
  Rating,
  StudioRoyaltyInfo,
  SubscriberViewLimit,
}
