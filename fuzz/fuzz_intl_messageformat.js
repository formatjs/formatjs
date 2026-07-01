const {FuzzedDataProvider} = require('@jazzer.js/core')
const {IntlMessageFormat} = require('intl-messageformat')

const LOCALES = [
  'en',
  'en-US',
  'fr',
  'de',
  'es',
  'ja',
  'zh',
  'ar',
  'pt-BR',
  'ru',
]

module.exports.fuzz = function (data) {
  const fdp = new FuzzedDataProvider(data)

  const locale = LOCALES[fdp.consumeIntegralInRange(0, LOCALES.length - 1)]
  const ignoreTag = fdp.consumeBoolean()
  const requiresOtherClause = fdp.consumeBoolean()
  const shouldParseSkeletons = fdp.consumeBoolean()

  const message = fdp.consumeString(fdp.consumeIntegralInRange(0, 4096))
  const values = generateValues(fdp)

  let fmt
  try {
    fmt = new IntlMessageFormat(message, locale, undefined, {
      ignoreTag,
      requiresOtherClause,
      shouldParseSkeletons,
    })
  } catch (e) {
    if (!isExpectedError(e)) throw e
    return
  }

  try {
    fmt.format(values)
  } catch (e) {
    if (!isExpectedError(e)) throw e
  }

  try {
    fmt.formatToParts(values)
  } catch (e) {
    if (!isExpectedError(e)) throw e
  }
}

function generateValues(fdp) {
  const numKeys = fdp.consumeIntegralInRange(0, 8)
  const values = {}
  for (let i = 0; i < numKeys; i++) {
    const key = fdp.consumeString(fdp.consumeIntegralInRange(1, 16))
    if (!key) continue
    switch (fdp.consumeIntegralInRange(0, 4)) {
      case 0:
        values[key] = fdp.consumeIntegralInRange(-1_000_000, 1_000_000)
        break
      case 1:
        values[key] = fdp.consumeString(fdp.consumeIntegralInRange(0, 64))
        break
      case 2:
        values[key] = fdp.consumeBoolean()
        break
      case 3:
        // Constrain to a sane Date range to avoid Invalid Date noise.
        values[key] = new Date(fdp.consumeIntegralInRange(0, 4_102_444_800_000))
        break
      default:
        values[key] = null
    }
  }
  return values
}

function isExpectedError(e) {
  if (e instanceof SyntaxError) return true
  if (e instanceof TypeError) return true
  if (e instanceof RangeError) return true

  // intl-messageformat raises Error subclasses (FormatError, MissingValueError,
  // InvalidValueTypeError, …) for malformed messages or values. Filter on the
  // ICU/formatjs error code or message text.
  const code = e && typeof e.code === 'string' ? e.code : ''
  if (
    code.startsWith('FORMAT_ERROR') ||
    code.startsWith('INVALID_') ||
    code === 'MISSING_VALUE' ||
    code === 'MISSING_INTL_API'
  ) {
    return true
  }

  const msg = e && e.message ? String(e.message).toLowerCase() : ''
  return EXPECTED_MESSAGE_FRAGMENTS.some(f => msg.includes(f))
}

const EXPECTED_MESSAGE_FRAGMENTS = [
  'is not a function',
  'cannot read',
  'undefined',
  'invalid',
  'unexpected',
  'expected',
  'unsupported',
  'must be',
  'missing',
  'no value',
  'not found',
  'malformed',
  'no other clause',
  'needs other clause',
  'is not finite',
]
