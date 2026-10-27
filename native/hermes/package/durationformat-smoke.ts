export {}
type DurationUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'
  | 'microseconds'
  | 'nanoseconds'
type TextStyle = 'long' | 'short' | 'narrow'
type DurationOptions = {
  localeMatcher?: 'lookup' | 'best fit'
  numberingSystem?: string
  style?: TextStyle | 'digital'
  fractionalDigits?: number
} & Partial<Record<'years' | 'months' | 'weeks' | 'days', TextStyle>> &
  Partial<
    Record<'hours' | 'minutes' | 'seconds', TextStyle | 'numeric' | '2-digit'>
  > &
  Partial<
    Record<
      'milliseconds' | 'microseconds' | 'nanoseconds',
      TextStyle | 'numeric'
    >
  > &
  Partial<Record<`${DurationUnit}Display`, 'always' | 'auto'>>
interface DurationFormatter {
  format(value: Partial<Record<DurationUnit, number>> | string): string
  formatToParts(
    value: Partial<Record<DurationUnit, number>> | string
  ): {type: string; value: string; unit?: string}[]
  resolvedOptions(): DurationOptions & {locale: string; numberingSystem: string}
}
interface DurationConstructor {
  new (
    locales?: string | string[],
    options?: DurationOptions
  ): DurationFormatter
  supportedLocalesOf(locales: string[]): string[]
}
const DurationFormat = (
  Intl as unknown as {DurationFormat: DurationConstructor}
).DurationFormat
const root = globalThis as unknown as {
  __SDK_DURATION_PASSED?: boolean
}
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(DurationFormat.supportedLocalesOf(['en', 'fr', 'fi', 'zz']), [
  'en',
  'fr',
  'fi',
])
const old = new DurationFormat('en', {
  style: 'digital',
  minutesDisplay: 'auto',
  secondsDisplay: 'auto',
})
equal(old.resolvedOptions().numberingSystem, 'latn')
equal(old.format({seconds: 1, milliseconds: 473}), '0:00:01.473')
equal(old.format({hours: 1, seconds: 2}), '1:00:02')
equal(
  new DurationFormat('en', {style: 'digital', fractionalDigits: 2}).format({
    seconds: -1,
    milliseconds: -473,
  }),
  '-0:00:01.47'
)
equal(old.formatToParts({seconds: -1, milliseconds: -473}), [
  {type: 'minusSign', value: '-', unit: 'hour'},
  {type: 'integer', value: '0', unit: 'hour'},
  {type: 'literal', value: ':'},
  {type: 'integer', value: '00', unit: 'minute'},
  {type: 'literal', value: ':'},
  {type: 'integer', value: '01', unit: 'second'},
  {type: 'decimal', value: '.', unit: 'second'},
  {type: 'fraction', value: '473', unit: 'second'},
])
equal(old.format({microseconds: 1e18 + 100}), '0:00:1000000000000.000128')
equal(
  new DurationFormat('fi', {style: 'digital'}).format({
    hours: 1,
    minutes: 2,
    seconds: 3,
  }),
  '1.02.03'
)
equal(
  new DurationFormat('fr', {style: 'digital'}).format({
    seconds: 1,
    milliseconds: 473,
  }),
  '0:00:01,473'
)
equal(
  new DurationFormat('en', {style: 'digital', numberingSystem: 'arab'}).format({
    hours: 1,
    minutes: 2,
    seconds: 3,
  }),
  '١:٠٢:٠٣'
)
let caught = false
try {
  old.format({seconds: 1n as unknown as number})
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('BigInt must throw')
caught = false
try {
  old.format('PT1H')
} catch (error) {
  caught = error instanceof RangeError
}
if (!caught)
  throw new Error('Duration strings require Temporal before installation')
const number = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!,
  list = Object.getOwnPropertyDescriptor(Intl, 'ListFormat')!
try {
  Reflect.deleteProperty(Intl, 'NumberFormat')
  Reflect.deleteProperty(Intl, 'ListFormat')
  equal(
    new DurationFormat('en', {style: 'digital'}).format({hours: 1, seconds: 2}),
    '1:00:02'
  )
} finally {
  Object.defineProperty(Intl, 'NumberFormat', number)
  Object.defineProperty(Intl, 'ListFormat', list)
}
root.__SDK_DURATION_PASSED = true
