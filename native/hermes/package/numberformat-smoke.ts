export {}
interface RustNumberFormat extends Intl.NumberFormat {
  format(value?: unknown): string
  formatToParts(value?: unknown): Intl.NumberFormatPart[]
  formatRange(start: unknown, end: unknown): string
  formatRangeToParts(start: unknown, end: unknown): Intl.NumberRangeFormatPart[]
}
interface RustNumberConstructor {
  new (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
  ): RustNumberFormat
  (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
  ): RustNumberFormat
  prototype: RustNumberFormat
  supportedLocalesOf(locales: string | string[]): string[]
}
const NumberFormat = Intl.NumberFormat as unknown as RustNumberConstructor
const root = globalThis as unknown as {
  __SDK_NUMBER_PASSED?: boolean
}
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(NumberFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
const model = NumberFormat('en')
equal(model.format('9007199254740993.125'), '9,007,199,254,740,993.125')
equal(model.format(9007199254740993n), '9,007,199,254,740,993')
equal(model.format(-0), '-0')
equal(model.formatRange(1, 2), '1–2')
equal(model.formatRangeToParts(1, 2), [
  {type: 'integer', value: '1', source: 'startRange'},
  {type: 'literal', value: '–', source: 'shared'},
  {type: 'integer', value: '2', source: 'endRange'},
])
if (model.format !== model.format) throw new Error('cached format')
const format = model.format
equal(format.call({}, 1.5), '1.5')
equal(format.name, '')
equal(format.length, 1)
let caught = false
try {
  Reflect.construct(format, [1])
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('non-constructor format')
caught = false
try {
  model.format(Symbol('value'))
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('Symbol TypeError')
const getter = Object.getOwnPropertyDescriptor(
  NumberFormat.prototype,
  'format'
)!.get!
caught = false
try {
  getter.call({})
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('private NumberFormat brand')
equal(
  new NumberFormat('en', {style: 'currency', currency: 'JPY'}).format(1.25),
  '¥1'
)
equal(
  new NumberFormat('en', {style: 'unit', unit: 'kilometer-per-hour'}).format(5),
  '5 km/h'
)
equal(new NumberFormat('en', {notation: 'compact'}).format(1e-7), '0.0000001')
equal(
  new NumberFormat('en', {
    notation: 'scientific',
    numberingSystem: 'arab',
  }).format(1234),
  '١٫٢٣٤اس٣'
)
equal(NumberFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
equal(new NumberFormat('fr').format(1234.5), '1 234,5')
equal(model.format(1.5), '1.5')
const pluralDescriptor = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')
if (!Reflect.deleteProperty(Intl, 'PluralRules'))
  throw new Error('remove JS PluralRules for smoke')
equal(
  new NumberFormat('en', {
    style: 'unit',
    unit: 'meter',
    unitDisplay: 'long',
  }).format(2),
  '2 meters'
)
if (pluralDescriptor)
  Object.defineProperty(Intl, 'PluralRules', pluralDescriptor)
root.__SDK_NUMBER_PASSED = true
