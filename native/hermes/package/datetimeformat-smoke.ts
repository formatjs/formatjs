export {}
interface RustDateTimeConstructor {
  new (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): Intl.DateTimeFormat
  supportedLocalesOf(locales: string[]): string[]
  __addCalendarData(...packs: string[]): void
  __addTZData(pack: string): void
}
const DateTimeFormat = Intl.DateTimeFormat as unknown as RustDateTimeConstructor
const root = globalThis as unknown as {
  __SDK_DATETIME_HEBREW: string
  __SDK_DATETIME_TZ: string
  __SDK_DATETIME_PASSED?: boolean
}
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(DateTimeFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
const old = new DateTimeFormat('en', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
equal(old.format(0), '01/01/1970')
if (old.format !== old.format) throw new Error('Uncached bound format')
equal(old.formatToParts(0), [
  {type: 'month', value: '01'},
  {type: 'literal', value: '/'},
  {type: 'day', value: '01'},
  {type: 'literal', value: '/'},
  {type: 'year', value: '1970'},
])
const range = old.formatRangeToParts(0, 86400000)
equal(range.map(part => part.value).join(''), old.formatRange(0, 86400000))
if (
  !range.some(part => part.source === 'startRange') ||
  !range.some(part => part.source === 'endRange')
)
  throw new Error('Missing range sources')
equal(DateTimeFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
equal(old.format(0), '01/01/1970')
equal(
  new DateTimeFormat('fr', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(0),
  '1 janvier 1970'
)
const ny = new DateTimeFormat('en', {
  timeZone: 'America/New_York',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
})
equal(ny.format(Date.UTC(2024, 2, 10, 7, 30)), '07:30')
DateTimeFormat.__addTZData(root.__SDK_DATETIME_TZ)
equal(ny.format(Date.UTC(2024, 2, 10, 6, 30)), '01:30')
equal(ny.format(Date.UTC(2024, 2, 10, 7, 30)), '03:30')
DateTimeFormat.__addCalendarData(root.__SDK_DATETIME_HEBREW)
equal(
  new DateTimeFormat('en', {calendar: 'hebrew'}).resolvedOptions().calendar,
  'hebrew'
)
const hebrew = new DateTimeFormat('en', {
  calendar: 'hebrew',
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
equal(hebrew.resolvedOptions().calendar, 'hebrew')
const parts = hebrew.formatToParts(Date.UTC(2024, 2, 24))
equal(parts.find(part => part.type === 'year')?.value, '5784')
equal(parts.find(part => part.type === 'month')?.value, 'Adar II')
for (const value of [1n, Symbol('date')]) {
  let caught = false
  try {
    old.format(value as unknown as number)
  } catch (error) {
    caught = error instanceof TypeError
  }
  if (!caught) throw new Error('Invalid numeric type accepted')
}
const number = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
const plural = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!
try {
  Reflect.deleteProperty(Intl, 'NumberFormat')
  Reflect.deleteProperty(Intl, 'PluralRules')
  equal(old.format(0), '01/01/1970')
  equal(hebrew.formatToParts(Date.UTC(2024, 2, 24)), parts)
} finally {
  Object.defineProperty(Intl, 'NumberFormat', number)
  Object.defineProperty(Intl, 'PluralRules', plural)
}
root.__SDK_DATETIME_PASSED = true
