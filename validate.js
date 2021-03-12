const fxp = require('fast-xml-parser')

/**
 * A container for a validation error derived from a `SyntaxError` class.
 * @public
 * @memberof validate
 */
class ValidationError extends SyntaxError {

  /**
   * Creates a `ValidationError` from a variety of input.
   * @param {String|Object|Error} input
   * @param {...Mixed} args
   * @return {ValidationError}
   */
  static from(input, ...args) {
    if (input && 'object' === typeof input) {
      return new this(input.code, input.message || input.msg || '', input)
    }

    return new this(input, ...args)
  }

  /**
   * `ValidationError` class constructor.
   * @public
   * @constructor
   * @param {String} code
   * @param {String} message
   * @param {?Object} opts
   */
  constructor(code, message, opts) {
    super(message)

    this.code = code
    this.message = message
    this.position = opts.position || 0

    if ('number' === opts.line) {
      this.position = opts.line
    }
  }
}

/**
 * Validates XML source input string.
 * @public
 * @param {String} xml
 * @return {Boolea}
 * @throws ValidationError
 */
function validate(xml, opts) {
  const result = fxp.validate(xml, {
    ...opts,
    allowBooleanAttributes: true
  })

  if (result && result.err) {
    // allow broken entities...
    if ('InvalidChar' === result.err.code && /char '&' is not expected/i.test(result.err.message)) {
      throw ValidationError.from(result.err)
    }
  }

  return xml
}

/**
 * A module to provide XML validation.
 * @public
 * @module validate
 * @see {@link https://github.com/NaturalIntelligence/fast-xml-parser}
 * @example
 * const { validate } = require('mediaxml/validate')
 * try {
 *   validate(xml)
 * } catch (err) {
 *   // handle validation error
 * }
 */
module.exports = {
  ValidationError,
  validate
}
