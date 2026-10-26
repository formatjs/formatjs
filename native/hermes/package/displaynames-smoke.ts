export {}

const root = globalThis as any
const DisplayNames = Intl.DisplayNames as typeof Intl.DisplayNames & {
  __addLocaleData(...packs: string[]): void
}
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(DisplayNames.supportedLocalesOf(['en', 'fr', 'aa']), [])
DisplayNames.__addLocaleData(root.__SDK_DISPLAY_EN)
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
equal(DisplayNames.supportedLocalesOf('fr'), [])
DisplayNames.__addLocaleData(root.__SDK_DISPLAY_FR)
equal(new DisplayNames('fr', {type: 'language'}).of('en'), 'anglais')
equal(english.of('en'), 'English')
equal(DisplayNames.supportedLocalesOf(['fr-FR-u-nu-arab']), ['fr-FR-u-nu-arab'])
DisplayNames.__addLocaleData(root.__SDK_DISPLAY_AA)
equal(new DisplayNames('aa', {type: 'language'}).of('en'), 'en')
equal(
  new DisplayNames('aa', {type: 'language', fallback: 'none'}).of('en'),
  undefined
)
equal(new DisplayNames('aa', {type: 'calendar'}).of('gregory'), 'gregory')
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
