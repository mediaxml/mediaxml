const Timecode = require('smpte-timecode')
const camelcase = require('camelcase')

/**
 * Regex used to match a SMPTE time code.
 * Borrowed from the 'smpte-timecode' module.
 * @private
 */
const SMPTE_TIMECODE_REGEX = /^([012]\\d):(\\d\\d):(\\d\\d)(:|;|\\.)(\\d\\d)$/

/**
 * Normalize a value from a string or mixed input
 * @ignore
 * @param {?Mixed} value
 * @return {?Mixed}
 */
function normalizeValue(value) {
  const { isFinite = global.isFinite } = Number

  if ('string' !== typeof value) {
    return value
  }

  if (SMPTE_TIMECODE_REGEX.test(value)) {
    return new Timecode(value)
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
  } else {
    return value
  }
}

/**
 * Normalize attribute key-value pairs.
 * @ignore
 * @param {Object} attribute
 * @param {?Object} opts
 * @param {?Boolean} [opts.preserveConsecutiveUppercase = true] - Preserve consecutive uppercase characters in keys
 * @param {?Boolean} [opts.normalizeValues = true] - Preserve consecutive uppercase characters in keys
 * @return {Object}
 */
function normalizeAttributes(attributes, opts) {
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
 * Normalize attribute key.
 * @ignore
 * @param {String} key - Key to normalize
 * @param {?Object} opts - Key normalization options
 * @param {?Boolean} [opts.preserveConsecutiveUppercase = true] - Preserve consecutive uppercase characters
 * @return {String}
 */
function normalizeAttributeKey(key, opts) {
  return camelcase(key, {
    preserveConsecutiveUppercase: true,
    ...opts
  })
}

/**
 * Normalize attribute value.
 * @ignore
 * @param {String} value - Value to normalize
 * @param {?Object} opts - Value normalization options **unusued**
 * @return {String}
 */
function normalizeAttributeValue(value) {
  return normalizeValue(value)
}

/**
 * Module exports.
 * @private
 */
module.exports = {
  normalizeAttributeValue,
  normalizeAttributeKey,
  normalizeAttributes,
  normalizeValue
}
