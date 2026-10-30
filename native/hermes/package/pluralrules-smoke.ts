export {}

const root = globalThis as any
type Rules = Intl.PluralRules & {
  selectRange(start: unknown, end: unknown): string
}
const PluralRules = Intl.PluralRules
function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(PluralRules.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
const english = new PluralRules('en') as Rules
const ordinal = new PluralRules('en', {type: 'ordinal'})
equal(english.select(1), 'one')
equal(ordinal.select(9007199254740993n as any), 'few')
equal(english.selectRange(1n, 2n), 'other')
equal(PluralRules.supportedLocalesOf('fr'), ['fr'])
equal(new PluralRules('fr').select(0), 'one')
equal(english.select(1), 'one')
equal(PluralRules.supportedLocalesOf(['fr-FR-u-nu-arab']), ['fr-FR-u-nu-arab'])
let typeError = false
try {
  PluralRules.prototype.select.call({}, 1)
} catch (error) {
  typeError = error instanceof TypeError
}
equal(typeError, true)
let rangeError = false
try {
  english.selectRange(NaN, 1)
} catch (error) {
  rangeError = error instanceof RangeError
}
equal(rangeError, true)
root.__SDK_PLURAL_PASSED = true
