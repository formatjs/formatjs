import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-numberformat/polyfill-force.js'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import calendars from '#packages/intl-datetimeformat/calendars/all.js'
const Native = Intl.DateTimeFormat as any
const fixtures = (globalThis as any).__DATETIME_FIXTURES as {
  locales: string[]
  packs: string[]
  calendars: string[]
  arithmetic: string[]
  patches: string[]
  timezone: string
}
const stringify = JSON.stringify
let assertions = 0,
  cases = 0
function check(value: unknown, message: string): void {
  assertions++
  if (!value) throw new Error(message)
}
function equal(actual: unknown, expected: unknown, message: string): void {
  check(
    stringify(actual) === stringify(expected),
    message + ': ' + stringify({actual, expected})
  )
}
function outcome(callback: () => unknown): unknown {
  try {
    return {value: callback()}
  } catch (error) {
    return {
      error:
        error instanceof TypeError
          ? 'TypeError'
          : error instanceof RangeError
            ? 'RangeError'
            : String(error),
    }
  }
}
function compare(
  locale: string,
  options: Intl.DateTimeFormatOptions,
  inputs: any[]
): void {
  const native = new Native(locale, options),
    reference = new Reference(locale, options)
  const label = stringify({locale, options})
  equal(
    native.resolvedOptions(),
    reference.resolvedOptions(),
    'resolved ' + label
  )
  equal(
    Object.keys(native.resolvedOptions()),
    Object.keys(reference.resolvedOptions()),
    'resolved order'
  )
  for (let index = 0; index < inputs.length; index++) {
    const value = inputs[index]
    equal(
      outcome(() => native.format(value)),
      outcome(() => reference.format(value)),
      'format ' + label + ' ' + index
    )
    equal(
      outcome(() => native.formatToParts(value)),
      outcome(() => reference.formatToParts(value)),
      'parts ' + label + ' ' + index
    )
    const next = inputs[(index + 1) % inputs.length]
    equal(
      outcome(() => native.formatRange(value, next)),
      outcome(() => reference.formatRange(value, next)),
      'range ' + label + ' ' + index
    )
    equal(
      outcome(() => native.formatRangeToParts(value, next)),
      outcome(() => reference.formatRangeToParts(value, next)),
      'range parts ' + label + ' ' + index
    )
    cases++
  }
}
check(
  typeof Native === 'function' && Native.polyfilled,
  'Rust DateTimeFormat installed'
)
equal(
  Native.supportedLocalesOf(['en', 'fr']),
  [],
  'locale loading stays on demand'
)
for (const text of fixtures.packs) {
  const pack = JSON.parse(text)
  Native.__addLocaleData(text)
  Reference.__addLocaleData(pack)
  ;(Intl.NumberFormat as any).__addLocaleData(pack.number)
}
const inputs = [
  0,
  -1,
  -0,
  0.9,
  -0.9,
  Date.UTC(2024, 2, 10, 7, 30),
  Date.UTC(2024, 10, 3, 6, 30),
  8.64e15,
  -8.64e15,
]
Reference.__addCalendarData(...calendars)
Native.__addCalendarData(...fixtures.arithmetic)
equal(
  new Native('en', {calendar: 'hebrew'}).resolvedOptions().calendar,
  'gregory',
  'arithmetic alone does not enable optional calendar'
)
for (const text of fixtures.patches) {
  Native.__addCalendarLocaleData(text)
  Reference.__addCalendarLocaleData(JSON.parse(text))
}
for (const calendar of fixtures.calendars)
  for (const locale of fixtures.locales)
    for (const profile of [
      {dateStyle: 'full'},
      {year: 'numeric', month: 'long', day: 'numeric'},
      {month: 'long'},
      {year: 'numeric', month: 'numeric', day: 'numeric'},
    ] as Intl.DateTimeFormatOptions[])
      compare(locale, {...profile, calendar, timeZone: 'UTC'}, [
        0,
        Date.UTC(2024, 1, 10),
        Date.UTC(2024, 2, 25),
        Date.UTC(2019, 4, 1),
        -8.64e15,
        8.64e15,
      ])
const profiles: Intl.DateTimeFormatOptions[] = [
  {},
  {dateStyle: 'full'},
  {dateStyle: 'short', timeStyle: 'long'},
  {year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'},
  {month: 'long'},
  {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false},
  {hour: 'numeric', dayPeriod: 'long', fractionalSecondDigits: 3},
  {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    formatMatcher: 'basic',
  },
  {
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZoneName: 'shortOffset',
  },
]
for (const locale of fixtures.locales)
  for (const profile of profiles)
    for (const numberingSystem of ['latn', 'arab', 'mathbold'])
      for (const timeZone of ['UTC', '+05:30', '-04:30'])
        compare(locale, {...profile, numberingSystem, timeZone}, inputs)
for (const options of [
  {calendar: 'x'},
  {numberingSystem: 'a'},
  {hour12: true, hourCycle: 'invalid'},
  {fractionalSecondDigits: 0},
  {fractionalSecondDigits: 2.9},
  {dateStyle: 'full', year: 'numeric'},
  {timeZone: 'bad'},
  null,
  1,
  () => {},
])
  equal(
    outcome(() => new Native('en', options)),
    outcome(() => new Reference('en', options as any)),
    'options errors'
  )
function getterOrder(Constructor: any, badCalendar: boolean): unknown {
  const events: string[] = []
  const options = Object.create(null)
  for (const name of [
    'localeMatcher',
    'calendar',
    'numberingSystem',
    'hour12',
    'hourCycle',
    'timeZone',
    'weekday',
    'era',
    'year',
    'month',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
    'timeZoneName',
    'formatMatcher',
    'dateStyle',
    'timeStyle',
  ])
    Object.defineProperty(options, name, {
      get() {
        events.push(name)
        return name === 'calendar' && badCalendar ? 'x' : undefined
      },
    })
  const result = outcome(() => new Constructor('en', options).resolvedOptions())
  return {events, result}
}
equal(getterOrder(Native, false), getterOrder(Reference, false), 'getter order')
equal(
  (getterOrder(Native, false) as {events: string[]}).events,
  [
    'localeMatcher',
    'calendar',
    'numberingSystem',
    'hour12',
    'hourCycle',
    'timeZone',
    'weekday',
    'era',
    'year',
    'month',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
    'timeZoneName',
    'formatMatcher',
    'dateStyle',
    'timeStyle',
  ],
  'complete constructor getter sequence'
)

equal(
  getterOrder(Native, true),
  getterOrder(Reference, true),
  'calendar failure stops later getters'
)
const native = new Native('en', {timeZone: 'UTC'}),
  reference = new Reference('en', {timeZone: 'UTC'})
for (const input of [
  NaN,
  Infinity,
  -Infinity,
  8.64e15 + 1,
  undefined,
  null,
  true,
  '123',
  1n,
  Symbol('value'),
  {
    valueOf() {
      return 123
    },
  },
  {
    valueOf() {
      return 1n
    },
  },
  {
    [Symbol.toPrimitive]() {
      return 1n
    },
  },
])
  equal(
    outcome(() => native.format(input)),
    outcome(() => reference.format(input as any)),
    'value coercion'
  )
const sentinel = {message: 'user exception'}
for (const Constructor of [Native, Reference]) {
  let caught
  try {
    new Constructor('en', {
      get year() {
        throw sentinel
      },
    })
  } catch (error) {
    caught = error
  }
  check(caught === sentinel, 'getter exception identity')
  caught = undefined
  try {
    new Constructor('en').format({
      valueOf() {
        throw sentinel
      },
    })
  } catch (error) {
    caught = error
  }
  check(caught === sentinel, 'coercion exception identity')
}
check(native.format === native.format, 'cached bound format')
equal(Object.keys(native), [], 'no instance properties')
for (const key of [
  'formatToParts',
  'formatRange',
  'formatRangeToParts',
  'resolvedOptions',
]) {
  const descriptor = Object.getOwnPropertyDescriptor(Native.prototype, key)!
  equal(
    [descriptor.enumerable, descriptor.configurable, descriptor.writable],
    [false, true, true],
    'method descriptor ' + key
  )
  equal(
    outcome(() => Reflect.construct(descriptor.value, [])),
    {error: 'TypeError'},
    'method nonconstructible ' + key
  )
  equal(
    outcome(() => descriptor.value.call({})),
    {error: 'TypeError'},
    'method brand ' + key
  )
}
equal(
  [
    Native.length,
    Native.supportedLocalesOf.length,
    native.format.length,
    native.format.name,
  ],
  [0, 1, 1, ''],
  'function metadata'
)
equal(
  outcome(() => Reflect.construct(native.format, [])),
  {error: 'TypeError'},
  'bound format nonconstructible'
)
check(Native('en').resolvedOptions().locale === 'en', 'callable constructor')
const format = Object.getOwnPropertyDescriptor(Native.prototype, 'format')!
equal(
  outcome(() => format.get!.call({})),
  {error: 'TypeError'},
  'format getter brand'
)
equal(
  outcome(() =>
    native.formatRange(undefined, {
      valueOf() {
        throw sentinel
      },
    })
  ),
  {error: 'TypeError'},
  'range missing endpoint before coercion'
)
const Temporal = (globalThis as any).Temporal
check(!!Temporal, 'real Temporal brands installed before native facade')
const temporalPairs = [
  [new Temporal.PlainDate(2024, 2, 29), new Temporal.PlainDate(2024, 3, 1)],
  [new Temporal.PlainYearMonth(2024, 2), new Temporal.PlainYearMonth(2024, 3)],
  [new Temporal.PlainMonthDay(2, 29), new Temporal.PlainMonthDay(3, 1)],
  [
    new Temporal.PlainTime(12, 30, 1, 234, 567, 890),
    new Temporal.PlainTime(12, 30, 1, 234, 567, 891),
  ],
  [
    new Temporal.PlainDateTime(2024, 2, 29, 12, 30, 1, 234, 567, 890),
    new Temporal.PlainDateTime(2024, 3, 1, 12, 30, 1, 234, 567, 891),
  ],
  [
    new Temporal.Instant(1700000000123456789n),
    new Temporal.Instant(1700000000123456790n),
  ],
  [
    new Temporal.ZonedDateTime(1700000000123456789n, 'UTC'),
    new Temporal.ZonedDateTime(1700000000123456790n, 'UTC'),
  ],
]
for (const [first, second] of temporalPairs)
  for (const profile of [
    {},
    {dateStyle: 'full'},
    {timeStyle: 'long'},
    {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
    },
  ])
    compare(
      'en',
      {...profile, timeZone: '+05:30'} as Intl.DateTimeFormatOptions,
      [first, second]
    )
const plain = new Temporal.PlainDate(2024, 2, 29)
for (const name of [
  'year',
  'month',
  'day',
  'calendarId',
  'toString',
  Symbol.toStringTag,
])
  Object.defineProperty(plain, name, {
    get() {
      throw sentinel
    },
  })
equal(
  native.format(plain),
  reference.format(plain),
  'Temporal intrinsic brands ignore instance getters'
)
const prototypeFake = Object.create(Temporal.PlainDate.prototype)
equal(
  outcome(() => native.format(prototypeFake)),
  outcome(() => reference.format(prototypeFake)),
  'prototype imitation rejected'
)
equal(
  outcome(() => native.formatRange(temporalPairs[0][0], 0)),
  outcome(() => reference.formatRange(temporalPairs[0][0], 0)),
  'range type mismatch'
)
function customCalendar(Constructor: any, isNative: boolean): unknown {
  const source = JSON.parse(fixtures.packs[0])
  const patch = {
    locale: 'en',
    calendar: 'custom',
    data: source.data,
    formats: source.data.formats.gregory,
  }
  Constructor.__addCalendarLocaleData(isNative ? stringify(patch) : patch)
  const events: unknown[] = [],
    fields = {era: 'AD', year: 2000, month: 0, day: 1}
  Constructor.__addCalendarData({
    calendar: 'custom',
    dateFromTime(this: unknown, milliseconds: number) {
      check(this === Constructor.calendarData, 'calendar this binding')
      events.push(milliseconds)
      return fields
    },
  })
  const formatter = new Constructor('en', {
    calendar: 'custom',
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const parts = formatter.formatRangeToParts(0, 86400000)
  Constructor.__addCalendarData({
    calendar: 'custom',
    dateFromTime() {
      throw sentinel
    },
  })
  let caught
  try {
    formatter.format(0)
  } catch (error) {
    caught = error
  }
  check(caught === sentinel, 'calendar exception identity')
  return {
    parts,
    events,
    customOwn: Object.prototype.hasOwnProperty.call(
      Constructor.calendarData,
      'custom'
    ),
  }
}
equal(
  customCalendar(Native, true),
  customCalendar(Reference, false),
  'custom calendar bridge'
)
const before = new Native('en', {timeZone: 'UTC', year: 'numeric'}).format(0)
Object.defineProperty(Object.prototype, 'toJSON', {
  configurable: true,
  value() {
    throw sentinel
  },
})
let poisoned
try {
  poisoned = new Native('en', {timeZone: 'UTC', year: 'numeric'}).format(0)
} finally {
  delete (Object.prototype as any).toJSON
}
equal(poisoned, before, 'native request records ignore inherited toJSON')
Native.__addTZData(fixtures.timezone)
Reference.__addTZData(JSON.parse(fixtures.timezone))
for (const timeZone of [
  'America/New_York',
  'Asia/Kolkata',
  'Pacific/Apia',
  'Europe/Paris',
])
  for (const locale of ['en', 'fr', 'ar', 'ru'])
    for (const timeZoneName of [
      'long',
      'short',
      'longOffset',
      'shortOffset',
      'longGeneric',
      'shortGeneric',
    ] as const)
      compare(
        locale,
        {
          timeZone,
          timeZoneName,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
        inputs
      )

;(globalThis as any).print(
  stringify({
    type: 'DateTimeFormat-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
