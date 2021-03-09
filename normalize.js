const { Timecode: NPTTimecode } = require('npt-timecode')
const SMPTETimecode = require('smpte-timecode')
const camelcase = require('camelcase')
const duration = require('tinyduration')

/**
 * Regex used to match a SMPTE time code.
 * Borrowed from the 'smpte-timecode' module.
 * @private
 */
const SMPTE_TIMECODE_REGEX = /^([012]\\d):(\\d\\d):(\\d\\d)(:|;|\\.)(\\d\\d)$/

/**
 * TODO
 * @private
 */
const ISO_8601_2004_2019_REGEX = /([0-9]{4})-?([0-9]{2})-?([0-9]{2})T?([0-9]{2})([0-9]{2})?([0-9]{2})?\s?([-|+|:|0-9]+)?/

/**
 * Normalize a value from a string or mixed input.
 * @public
 * @memberof normalize
 * @param {?*} value
 * @return {?*}
 * @see https://github.com/MelleB/tinyduration
 * @see https://github.com/little-core-labs/npt-timecode
 * @see https://github.com/CrystalComputerCorp/smpte-timecode
 * @example
 * console.log(normalizeValue())
 * // null
 * @example
 * console.log(normalizeValue(true))
 * // true
 * @example
 * console.log(normalizeValue(false))
 * // true
 * @example
 * console.log(normalizeValue('foo'))
 * // 'foo'
 * @example
 * console.log(normalizeValue('123.45'))
 * // 123.45
 * @example
 * console.log(normalizeValue('2021-01-23T18:12:42.963Z'))
 * // Date (2021-01-23T18:12:42.963Z)
 * @example
 * console.log('NPT Timecode', normalizeValue('00:45))
 * // Timecode (00:00:45-) { start: Time (00:45:32) { value: 2732 }, ... }
 * @example
 * console.log('SMPTE Timecode', normalizeValue('00:45:32;00'))
 * // Timecode  { frameRate: 29.97, dropFrame: true, .... }
 * @example
 * console.log('ISO-8601 Duration', normalizeValue('P1Y2M3DT4H5M6S'))
 * // { years: 1, months: 2, days: 3, ... }
 */
function normalizeValue(value) {
  const { isFinite = global.isFinite } = Number
  if (undefined === value) {
    return null
  }

  // `typeof` is not used so we can detect input that
  // boxes or extends a `String`
  if (false === (value instanceof String) && 'string' !== typeof value) {
    return value
  }

  try {
    const [, year, month, date, hour, minute, second, tz] = value.match(ISO_8601_2004_2019_REGEX)
    let timezone = null

    if (tz) {
      timezone = tz.replace(/^([-|+])?([0-9]?[0-9])([0-9][0-9])?$/g, (_, $1, $2, $3) => {
        return `${$1 || '+'}${$2.padStart(2, 0)}:${($3 || '').padStart(2, 0)}`
      })
    }

    const dateString = `${year}-${month}-${date}T${hour}:${minute}:${second}.000${timezone || ''}`
    const dateValue = new Date(dateString)

    if (!Number.isNaN(dateValue.valueOf())) {
      return dateValue
    }
  } catch (err) {
    void err
  }

  if ('' === value) {
    return ''
  } else if ('true' === value) {
    return true
  } else if ('false' === value) {
    return false
  } else if ('null' === value) {
    return null
  } else if (value && isFinite(+value)) {
    return parseFloat(value)
  } else if (!Number.isNaN(Date.parse(value))) {
    return new Date(value)
  }

  try {
    return new SMPTETimecode(value)
  } catch (err) {
    void err
  }

  try {
    const result = duration.parse(value)
    if (result) {
      Object.defineProperty(result, 'toString', {
        enumerable: false,
        value: () => value
      })
    }
    return result
  } catch (err) {
    void err
  }

  if (/(^-?[0-9|.|:]+|now-?$)/g.test(value)) {
    const normalPlayTime = NPTTimecode.from(value)
    if (normalPlayTime.start.isValid || normalPlayTime.stop.isVald) {
      return normalPlayTime
    }
  }

  return value
}

/**
 * Normalize attribute key-value pairs.
 * @public
 * @memberof normalize
 * @param {Object} attribute
 * @param {?Object} opts
 * @param {?Boolean} [opts.preserveConsecutiveUppercase = true] - Preserve consecutive uppercase characters in keys
 * @param {?Boolean} [opts.normalizeValues = true] - Preserve consecutive uppercase characters in keys
 * @return {Object}
 * @example
 * const attrs = normalizeAttributes({ Time_Code: '00:01.5-01:00' })
 * console.log(attrs.timeCode)
 * // Timecode (00:00:01.5-00:01:00) {
 * //   start: Time (00:00:01.5) { value: 1.5 },
 * //   stop: Time (00:01:00) { value: 60 }
 * // }
 */
function normalizeAttributes(attributes, opts) {
  if (!opts) { opts = {} }
  if (!attributes) { return {} }

  const keys = Object.keys(attributes)

  for (const key of keys) {
    const normalizedKey = normalizeAttributeKey(key, opts)
    const descriptor = Object.assign(Object.getOwnPropertyDescriptor(attributes, key), {
      enumerable: true,
    })

    if (false !== opts.normalizeValues) {
      descriptor.value = normalizeAttributeValue(attributes[key], opts)
    }

    Object.defineProperty(attributes, normalizedKey, descriptor)

    if (key !== normalizedKey) {
      delete attributes[key]
    }
  }

  return attributes
}

/**
 * Normalize key.
 * @public
 * @memberof normalize
 * @param {String} key - Key to normalize
 * @param {?Object} opts - Key normalization options
 * @param {?Boolean} [opts.preserveConsecutiveUppercase = false] - Preserve consecutive uppercase characters
 * @return {String}
 * @see https://github.com/sindresorhus/camelcase
 * @example
 * console.log(normalizeKey('Asset_ID'))
 * // 'assetId'
 * @example
 * console.log(normalizeKey('Asset_ID'), { preserveConsecutiveUppercase: true })
 * // 'assetID'
 */
function normalizeKey(key, opts) {
  key = key.replace(/[:|-]+/g, '_')
  return camelcase(key, {
    preserveConsecutiveUppercase: false,
    ...opts
  })
}

/**
 * Normalize attribute key.
 * @public
 * @memberof normalize
 * @param {String} key - Key to normalize
 * @param {?Object} opts - Key normalization options
 * @param {?Boolean} [opts.preserveConsecutiveUppercase = true] - Preserve consecutive uppercase characters
 * @return {String}
 * @see normalizeKey
 * @see https://github.com/sindresorhus/camelcase
 * @example
 * console.log(normalizeAttributeKey('Provider_ID'))
 * // 'providerID'
 * @example
 * console.log(normalizeAttributeKey('Provider_ID'), { preserveConsecutiveUppercase: false })
 * // 'providerId'
 */
function normalizeAttributeKey(key, opts) {
  return normalizeKey(key, {
    preserveConsecutiveUppercase: true,
    ...opts
  })
}

/**
 * Normalize attribute value.
 * @public
 * @memberof normalize
 * @param {String} value - Value to normalize
 * @return {String}
 * @see normalizeValue
 * @example
 * console.log(normalizeAttributeValue('2021-01-23T18:12:42.963Z'))
 * // Date (2021-01-23T18:12:42.963Z)
 */
function normalizeAttributeValue(value) {
  return normalizeValue(value)
}

/**
 * A module that provides various normalization functions.
 * @public
 * @module normalize
 * @example
 * const { normalizeKey, normalizeValue, normalizeAttributes } = require('mediaxml/normalize')
 * console.log(normalizeKey('Asset_ID'))
 * // 'assetId'
 *
 * console.log(normalizeValue('2021-01-23T18:12:42.963Z'))
 * // Date (2021-01-23T18:12:42.963Z)
 *
 * console.log(normalizeAttributes({ Time_Code: '00:01.5-01:00' }).timeCode)
 * // Timecode (00:00:01.5-00:01:00) {
 * //   start: Time (00:00:01.5) { value: 1.5 },
 * //   stop: Time (00:01:00) { value: 60 }
 * // }
 */
module.exports = {
  normalizeAttributes,
  normalizeAttributeKey,
  normalizeAttributeValue,
  normalizeKey,
  normalizeValue
}
