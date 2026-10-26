export {}
interface RustRelativeConstructor {
  new (
    locales?: string | string[],
    options?: Intl.RelativeTimeFormatOptions & {numberingSystem?: string}
  ): Intl.RelativeTimeFormat
  supportedLocalesOf(locales: string[]): string[]
  __addLocaleData(...packs: string[]): void
}
const RelativeTimeFormat =
  Intl.RelativeTimeFormat as unknown as RustRelativeConstructor
const root = globalThis as unknown as {
  __SDK_RELATIVE_EN: string
  __SDK_RELATIVE_FR: string
  __SDK_RELATIVE_PASSED?: boolean
}
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(RelativeTimeFormat.supportedLocalesOf(['en', 'fr']), [])
RelativeTimeFormat.__addLocaleData(root.__SDK_RELATIVE_EN)
const old = new RelativeTimeFormat('en')
equal(old.format(-0, 'day'), '0 days ago')
equal(
  new RelativeTimeFormat('en', {numeric: 'auto'}).format(-1, 'day'),
  'yesterday'
)
equal(old.formatToParts(1.25, 'day'), [
  {type: 'literal', value: 'in '},
  {type: 'integer', value: '1', unit: 'day'},
  {type: 'decimal', value: '.', unit: 'day'},
  {type: 'fraction', value: '25', unit: 'day'},
  {type: 'literal', value: ' days'},
])
let caught = false
try {
  old.format(1n as unknown as number, 'day')
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('BigInt must throw')
RelativeTimeFormat.__addLocaleData(root.__SDK_RELATIVE_FR)
equal(RelativeTimeFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
equal(old.format(1, 'day'), 'in 1 day')
equal(new RelativeTimeFormat('fr').format(2, 'day'), 'dans 2 jours')
equal(
  new RelativeTimeFormat('fr', {numeric: 'auto'}).format(1, 'day'),
  'demain'
)
equal(
  new RelativeTimeFormat('en', {numberingSystem: 'arab'}).format(1234.5, 'day'),
  'in ١٬٢٣٤٫٥ days'
)
const number = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
const plural = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!
try {
  Reflect.deleteProperty(Intl, 'NumberFormat')
  Reflect.deleteProperty(Intl, 'PluralRules')
  equal(new RelativeTimeFormat('fr').format(2, 'day'), 'dans 2 jours')
} finally {
  Object.defineProperty(Intl, 'NumberFormat', number)
  Object.defineProperty(Intl, 'PluralRules', plural)
}
root.__SDK_RELATIVE_PASSED = true
