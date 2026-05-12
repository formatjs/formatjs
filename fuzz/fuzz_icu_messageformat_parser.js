const {FuzzedDataProvider} = require('@jazzer.js/core')
const {parse} = require('@formatjs/icu-messageformat-parser')

module.exports.fuzz = function (data) {
  const fdp = new FuzzedDataProvider(data)

  const opts = {
    ignoreTag: fdp.consumeBoolean(),
    requiresOtherClause: fdp.consumeBoolean(),
    shouldParseSkeletons: fdp.consumeBoolean(),
    captureLocation: fdp.consumeBoolean(),
  }

  const message = fdp.consumeRemainingAsString()

  try {
    parse(message, opts)
  } catch (e) {
    if (!isExpectedParserError(e)) {
      throw e
    }
  }
}

function isExpectedParserError(e) {
  // The parser throws SyntaxError on malformed ICU messages — that's the
  // documented contract. Anything else is interesting.
  return e instanceof SyntaxError
}
