export {}

const root = globalThis as any
const DisplayNames = Intl.DisplayNames
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(DisplayNames.supportedLocalesOf(['en', 'fr', 'zz']), ['en', 'fr'])
const english = new DisplayNames('en', {type: 'language'})
equal(english.of('en'), 'English')
equal(english.of('en-GB'), 'British English')
equal(
  new DisplayNames('en', {type: 'language', languageDisplay: 'standard'}).of(
    'en-GB'
  ),
  'English (United Kingdom)'
)
equal(new DisplayNames('en', {type: 'region'}).of('us'), 'United States')
equal(new DisplayNames('en', {type: 'currency'}).of('zzz'), 'ZZZ')
equal(
  new DisplayNames('en', {type: 'currency', fallback: 'none'}).of('zzz'),
  undefined
)
equal(DisplayNames.supportedLocalesOf('fr'), ['fr'])
equal(new DisplayNames('fr', {type: 'language'}).of('en'), 'anglais')
equal(english.of('en'), 'English')
equal(DisplayNames.supportedLocalesOf(['fr-FR-u-nu-arab']), ['fr-FR-u-nu-arab'])
equal(new DisplayNames('zz', {type: 'language'}).of('en'), 'English')
equal(
  new DisplayNames('zz', {type: 'language', fallback: 'none'}).of('en'),
  'English'
)
equal(
  new DisplayNames('zz', {type: 'calendar'}).of('gregory'),
  'Gregorian Calendar'
)
let badReceiver = false,
  badCode = false
try {
  DisplayNames.prototype.of.call({}, 'en')
} catch (error) {
  badReceiver = error instanceof TypeError
}
try {
  english.of('\ud800')
} catch (error) {
  badCode = error instanceof RangeError
}
equal([badReceiver, badCode], [true, true])
root.__SDK_DISPLAY_PASSED = true
