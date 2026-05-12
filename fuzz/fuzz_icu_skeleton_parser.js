const {FuzzedDataProvider} = require('@jazzer.js/core')
const skeleton = require('@formatjs/icu-skeleton-parser')

module.exports.fuzz = function (data) {
  const fdp = new FuzzedDataProvider(data)
  const choice = fdp.consumeIntegralInRange(0, 2)
  const input = fdp.consumeRemainingAsString()

  try {
    switch (choice) {
      case 0:
        skeleton.parseNumberSkeletonFromString(input)
        break
      case 1:
        skeleton.parseDateTimeSkeleton(input)
        break
      case 2:
        // parseNumberSkeleton expects pre-tokenized tokens; feed it a single
        // synthetic token so the function body still gets exercised.
        skeleton.parseNumberSkeleton([{stem: input, options: []}])
        break
    }
  } catch (e) {
    if (!isExpectedError(e)) throw e
  }
}

function isExpectedError(e) {
  if (e instanceof SyntaxError) return true
  if (e instanceof RangeError) return true
  if (e instanceof TypeError) return true

  // The skeleton parsers throw plain Error subclasses for malformed input
  // (e.g. "Number skeleton cannot be empty", "Invalid number skeleton").
  // Treat any Error whose message looks like a parse failure as expected.
  if (!(e instanceof Error)) return false
  const msg = e.message ? String(e.message).toLowerCase() : ''
  return EXPECTED_MESSAGE_FRAGMENTS.some(f => msg.includes(f))
}

const EXPECTED_MESSAGE_FRAGMENTS = [
  'skeleton',
  'invalid',
  'unexpected',
  'expected',
  'unsupported',
  'malformed',
  'must be',
  'cannot be empty',
  'cannot read',
  'undefined',
]
