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
const firstUseOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const
const firstUseEnd = 86_400_000
const expectedRange = new Native('en', firstUseOptions).formatRange(
  0,
  firstUseEnd
)
for (const Constructor of [Native, Reference]) {
  const {keys} = Object
  const {map, reduce} = Array.prototype
  const {get, set} = Map.prototype
  const {indexOf, slice} = String.prototype
  const unexpected = () => {
    throw new Error('Called a public method while preparing a date interval')
  }
  let range: string
  try {
    Object.keys = unexpected
    Array.prototype.map = Array.prototype.reduce = unexpected
    Map.prototype.get = Map.prototype.set = unexpected
    String.prototype.indexOf = String.prototype.slice = unexpected
    range = new Constructor('en', firstUseOptions).formatRange(0, firstUseEnd)
  } finally {
    Object.keys = keys
    Array.prototype.map = map
    Array.prototype.reduce = reduce
    Map.prototype.get = get
    Map.prototype.set = set
    String.prototype.indexOf = indexOf
    String.prototype.slice = slice
  }
  equal(range, expectedRange, 'first use of private interval patterns')
}
for (const Constructor of [Native, Reference]) {
  check(
    Constructor.prototype.constructor === Constructor,
    'prototype constructor'
  )
  const legacy = Object.create(Constructor.prototype)
  const options = {timeZone: 'UTC', year: 'numeric'}
  const formatter = new Constructor('en', options)
  check(Constructor.call(legacy, 'en', options) === legacy, 'legacy receiver')
  equal(legacy.resolvedOptions(), formatter.resolvedOptions(), 'legacy options')
  equal(legacy.format(0), formatter.format(0), 'legacy format')
  equal(
    outcome(() => legacy.formatToParts(0)),
    {error: 'TypeError'},
    'legacy parts'
  )
  Constructor.call(formatter, 'en', {timeZone: 'UTC', month: 'long'})
  equal(
    formatter.resolvedOptions().year,
    'numeric',
    'original options preserved'
  )

  const alternate = function () {}
  alternate.prototype = null as any
  const defaulted = Reflect.construct(Constructor, ['en', options], alternate)
  check(
    Object.getPrototypeOf(defaulted) === Constructor.prototype,
    'primitive newTarget.prototype uses the DateTimeFormat prototype'
  )
  const customPrototype = Object.create(null)
  const reads: string[] = []
  const newTarget = new Proxy(function () {}, {
    get(target, key, receiver) {
      if (key !== 'prototype') return Reflect.get(target, key, receiver)
      reads.push('prototype')
      return customPrototype
    },
  })
  const custom = Reflect.construct(
    Constructor,
    [
      'en',
      {
        get timeZone() {
          reads.push('timeZone')
          return 'UTC'
        },
      },
    ],
    newTarget
  )
  equal(reads, ['prototype', 'timeZone'], 'prototype read once before options')
  check(Object.getPrototypeOf(custom) === customPrototype, 'custom prototype')
  equal(
    Constructor.prototype.resolvedOptions.call(custom).timeZone,
    'UTC',
    'custom receiver has formatter slots'
  )

  const cold = new Constructor('en', options)
  const previousBound = Object.getOwnPropertyDescriptor(
    Object.prototype,
    'bound'
  )
  let firstFormat: Intl.DateTimeFormat['format']
  let secondFormat: Intl.DateTimeFormat['format']
  try {
    Object.defineProperty(Object.prototype, 'bound', {
      configurable: true,
      get() {
        throw new Error('Read inherited bound format')
      },
      set() {
        throw new Error('Wrote inherited bound format')
      },
    })
    firstFormat = cold.format
    secondFormat = cold.format
  } finally {
    if (previousBound) {
      Object.defineProperty(Object.prototype, 'bound', previousBound)
    } else {
      Reflect.deleteProperty(Object.prototype, 'bound')
    }
  }
  check(firstFormat === secondFormat, 'private bound format cache')
  equal(firstFormat(0), formatter.format(0), 'detached bound format')

  const firstCharacter = Object.getOwnPropertyDescriptor(String.prototype, '0')
  let emptyZone: unknown
  try {
    emptyZone = outcome(
      () =>
        new Constructor('en', {
          timeZone: {
            toString() {
              Object.defineProperty(String.prototype, '0', {
                configurable: true,
                get() {
                  throw new Error('Read past the end of an empty time zone')
                },
              })
              return ''
            },
          },
        })
    )
  } finally {
    if (firstCharacter) {
      Object.defineProperty(String.prototype, '0', firstCharacter)
    } else {
      Reflect.deleteProperty(String.prototype, '0')
    }
  }
  equal(emptyZone, {error: 'RangeError'}, 'empty time zone after coercion')

  const patternEnd = "HH–HH 'Uhr'".length
  const previousPatternEnd = Object.getOwnPropertyDescriptor(
    String.prototype,
    patternEnd
  )
  let quotedRange: Intl.DateTimeRangeFormatPart[]
  try {
    Object.defineProperty(String.prototype, patternEnd, {
      configurable: true,
      get() {
        throw new Error('Read past the closing quote in a date-time pattern')
      },
    })
    quotedRange = new Constructor('de', {
      timeZone: 'UTC',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatRangeToParts(0, 3600000)
  } finally {
    if (previousPatternEnd) {
      Object.defineProperty(String.prototype, patternEnd, previousPatternEnd)
    } else {
      Reflect.deleteProperty(String.prototype, patternEnd)
    }
  }
  equal(
    quotedRange,
    [
      {type: 'hour', value: '00', source: 'startRange'},
      {type: 'literal', value: '–', source: 'shared'},
      {type: 'hour', value: '01', source: 'endRange'},
      {type: 'literal', value: ' Uhr', source: 'shared'},
    ],
    'terminal quote in a range pattern'
  )

  const canonicalize = Intl.getCanonicalLocales
  const requested = 'en-u-nu-arab'
  let resolvedLocale: string
  let supportedLocales: string[]
  try {
    Intl.getCanonicalLocales = () => {
      throw new Error('Called replacement Intl.getCanonicalLocales')
    }
    resolvedLocale = new Constructor(requested, {
      timeZone: 'UTC',
    }).resolvedOptions().locale
    supportedLocales = Constructor.supportedLocalesOf([requested])
  } finally {
    Intl.getCanonicalLocales = canonicalize
  }
  equal(resolvedLocale, requested, 'constructor retains locale canonicalizer')
  equal(
    supportedLocales,
    [requested],
    'supportedLocalesOf retains canonicalizer'
  )

  const numberFormat = Intl.NumberFormat
  const numeric = new Constructor('en', {timeZone: 'UTC', year: 'numeric'})
  let renderedYear: string
  try {
    Intl.NumberFormat = class extends numberFormat {
      constructor() {
        super()
        throw new Error('Called replacement Intl.NumberFormat')
      }
    } as unknown as typeof numberFormat
    renderedYear = numeric.format(0)
  } finally {
    Intl.NumberFormat = numberFormat
  }
  equal(renderedYear, '1970', 'first render retains NumberFormat')

  const dateDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Date')!
  for (const method of ['format', 'formatToParts'] as const) {
    const before = stringify(numeric[method](Date.now()))
    let current: string
    try {
      Object.defineProperty(globalThis, 'Date', {
        configurable: true,
        get() {
          throw new Error('Read global Date')
        },
      })
      current = stringify(numeric[method]())
    } finally {
      Object.defineProperty(globalThis, 'Date', dateDescriptor)
    }
    const after = stringify(numeric[method](Date.now()))
    check(
      current === before || current === after,
      method + ' uses intrinsic Date.now without reading global Date'
    )
  }

  const periods = new Constructor('en', {timeZone: 'UTC', dayPeriod: 'long'})
  const morning = Date.UTC(2026, 0, 15, 9)
  const laterMorning = Date.UTC(2026, 0, 15, 11)
  const noon = Date.UTC(2026, 0, 15, 12)
  // ECMA-402 §11.5.8 steps 15.d.iii and 16 compare localized periods.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  equal(
    periods.formatRangeToParts(morning, laterMorning),
    [{type: 'dayPeriod', value: 'in the morning', source: 'shared'}],
    'equal stand-alone periods collapse'
  )
  equal(
    periods
      .formatRangeToParts(morning, noon)
      .filter(
        (part: Intl.DateTimeRangeFormatPart) => part.type === 'dayPeriod'
      ),
    [
      {type: 'dayPeriod', value: 'in the morning', source: 'startRange'},
      {type: 'dayPeriod', value: 'noon', source: 'endRange'},
    ],
    'distinct stand-alone periods retain both endpoints'
  )
}
const nativeLegacy = Object.create(Native.prototype)
const referenceLegacy = Object.create(Reference.prototype)
const legacyOptions = {timeZone: 'UTC'}
Native.call(nativeLegacy, 'en', legacyOptions)
Reflect.apply(Reference, referenceLegacy, ['en', legacyOptions])
check(
  Object.getOwnPropertySymbols(nativeLegacy)[0] ===
    Object.getOwnPropertySymbols(referenceLegacy)[0],
  'Hermes and TypeScript formatters share the realm fallback symbol'
)
const localeDate = new Date(0)
for (const [name, components] of [
  [
    'toLocaleString',
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    },
  ],
  ['toLocaleDateString', {year: 'numeric', month: 'numeric', day: 'numeric'}],
  [
    'toLocaleTimeString',
    {hour: 'numeric', minute: 'numeric', second: 'numeric'},
  ],
] as const) {
  equal(
    outcome(() => Reflect.construct(Object, [], Date.prototype[name])),
    {error: 'TypeError'},
    name + ' rejects construction'
  )
  const reads: string[] = []
  const locale = {
    get length() {
      reads.push('locales')
      return 1
    },
    0: 'en',
  }
  const options = {
    get timeZone() {
      reads.push('timeZone')
      return 'UTC'
    },
    get hour() {
      reads.push('hour')
      return undefined
    },
    get dateStyle() {
      reads.push('dateStyle')
      return undefined
    },
  }
  equal(
    Reflect.apply(Date.prototype[name], localeDate, [locale, options]),
    new Reference('en', {...components, timeZone: 'UTC'}).format(0),
    name + ' component defaults'
  )
  equal(
    reads,
    ['locales', 'timeZone', 'hour', 'dateStyle'],
    name + ' option read order'
  )
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
for (const Constructor of [Native, Reference]) {
  for (const calendar of ['chinese', 'dangi', 'hebrew', 'islamic-umalqura']) {
    const formatter = new Constructor('en', {
      calendar,
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    equal(formatter.resolvedOptions().calendar, calendar, 'selected calendar')
    const date = Date.UTC(2023, 2, 22)
    const expected = formatter.formatToParts(date)
    for (const [owner, key] of [
      [Math, 'floor'],
      [Number, 'isFinite'],
      [String.prototype, 'indexOf'],
      [String.prototype, 'slice'],
    ] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
      let actual: Intl.DateTimeFormatPart[]
      try {
        Object.defineProperty(owner, key, {
          ...descriptor,
          value() {
            throw new Error(
              'Called mutable ' + key + ' while decoding a calendar'
            )
          },
        })
        actual = formatter.formatToParts(date)
      } finally {
        Object.defineProperty(owner, key, descriptor)
      }
      equal(actual, expected, calendar + ' calendar ignores mutable ' + key)
    }
  }
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

// ECMA-402 §11.5.4 steps 8 and 15.b use localized digits and pattern literals.
// https://tc39.es/ecma402/#sec-formatdatetimepattern
// Test262 expects U+0020 before AM. CLDR uses U+202F.
// https://github.com/tc39/test262/issues/3711
for (const Constructor of [Reference, Native]) {
  const formatter = new Constructor('en-US-u-nu-hanidec', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const timestamp = Date.UTC(2024, 0, 1, 2, 35, 6)
  equal(
    formatter.formatToParts(timestamp),
    [
      {type: 'hour', value: '〇二'},
      {type: 'literal', value: ':'},
      {type: 'minute', value: '三五'},
      {type: 'literal', value: ':'},
      {type: 'second', value: '〇六'},
      {type: 'literal', value: '\u202f'},
      {type: 'dayPeriod', value: 'AM'},
    ],
    'Han decimal digits and CLDR day-period separator'
  )
}

// ECMA-402 §11.5.4 step 15.e and LDML localized GMT patterns.
for (const Constructor of [Reference, Native]) {
  for (const [locale, timeZone, timeZoneName, expected] of [
    ['en-u-nu-arab', '+05:30', 'longOffset', 'GMT+٠٥:٣٠'],
    ['en-u-nu-arab', '-04:00', 'shortOffset', 'GMT-٤'],
    ['en-u-nu-mathbold', '+05:30', 'longOffset', 'GMT+𝟎𝟓:𝟑𝟎'],
  ] as const) {
    const formatter = new Constructor(locale, {
      hour: 'numeric',
      timeZone,
      timeZoneName,
    })
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, timeZone)
    let parts: Intl.DateTimeFormatPart[]
    try {
      Object.defineProperty(Object.prototype, timeZone, {
        configurable: true,
        get() {
          throw new Error('inherited time-zone name')
        },
      })
      parts = formatter.formatToParts(0)
    } finally {
      if (previous) Object.defineProperty(Object.prototype, timeZone, previous)
      else Reflect.deleteProperty(Object.prototype, timeZone)
    }
    equal(
      parts.find(part => part.type === 'timeZoneName')?.value,
      expected,
      'localized GMT offset digits'
    )
  }
}

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
for (const Constructor of [Native, Reference]) {
  for (const method of ['get', 'set', 'has'] as const) {
    const options = {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    } as const
    const formatter = new Constructor('en', options)
    const original = WeakMap.prototype[method]
    let actual: unknown, error: unknown
    try {
      WeakMap.prototype[method] = () => {
        throw new Error(`Mutable WeakMap.${method}`)
      }
      actual = [
        formatter.format(0),
        formatter
          .formatToParts(0)
          .map((part: any) => part.value)
          .join(''),
        formatter.formatRange(0, 0),
        formatter
          .formatRangeToParts(0, 0)
          .map((part: any) => part.value)
          .join(''),
        new Constructor('en', options).format(0),
      ]
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(WeakMap.prototype, method, {value: original})
    }
    check(
      error === undefined,
      `private storage ignores WeakMap.${method}: ${String((error as Error)?.stack || error)}`
    )
    equal(
      actual,
      ['01/01/1970', '01/01/1970', '01/01/1970', '01/01/1970', '01/01/1970'],
      'private cache output'
    )
  }
}
for (const Constructor of [Native, Reference]) {
  const formatter = new Constructor('en', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const expected = formatter.formatToParts(0)
  const original = Array.from
  let actual: unknown, error: unknown
  try {
    Array.from = () => {
      throw new Error('Mutable array creation reached')
    }
    actual = formatter.formatToParts(0)
  } catch (caught) {
    error = caught
  } finally {
    Array.from = original
  }
  check(error === undefined, 'format parts ignores mutable Array.from')
  equal(
    actual,
    expected,
    'format parts preserves output during Array.from mutation'
  )
}
for (const Constructor of [Native, Reference]) {
  const expected = new Constructor('en', {timeZone: 'UTC'}).format(0)
  const original = Object.prototype.isPrototypeOf
  let actual: unknown, error: unknown
  try {
    Object.prototype.isPrototypeOf = () => {
      throw new Error('Mutable prototype helper reached')
    }
    actual = new Constructor('en', {timeZone: 'UTC'}).format(0)
  } catch (caught) {
    error = caught
  } finally {
    Object.prototype.isPrototypeOf = original
  }
  check(error === undefined, 'constructor ignores mutable isPrototypeOf')
  equal(
    actual,
    expected,
    'constructor preserves output under prototype mutation'
  )
}
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
  for (const [field, options] of [
    ['monthNumber', {month: 'numeric'}],
    ['monthNameIndex', {month: 'long'}],
    ['leapMonth', {month: 'long'}],
    ['monthStandalone', {month: 'long'}],
    ['weekdayStandalone', {weekday: 'long'}],
  ] as const) {
    const formatter = new Constructor('en', {...options, timeZone: 'UTC'})
    const first = Date.UTC(2026, 0, 15)
    const last = Date.UTC(2026, 1, 20)
    const own = Object.getOwnPropertyDescriptor(Object.prototype, field)
    const input = {
      valueOf() {
        Object.defineProperty(Object.prototype, field, {
          configurable: true,
          get() {
            throw new Error('Read inherited DateTimeFormat field ' + field)
          },
        })
        return first
      },
    }
    for (const method of ['formatToParts', 'formatRangeToParts'] as const) {
      const expected = formatter[method](first, last)
      let actual: unknown
      try {
        actual = formatter[method](input, last)
      } finally {
        if (own) Object.defineProperty(Object.prototype, field, own)
        else Reflect.deleteProperty(Object.prototype, field)
      }
      equal(actual, expected, method + ' ignores inherited ' + field)
    }
  }
}
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
for (const Constructor of [Reference, Native]) {
  const formatter = new Constructor('en-u-nu-arab', {
    hour: 'numeric',
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  })
  const parts: Intl.DateTimeFormatPart[] = formatter.formatToParts(
    Date.UTC(1880, 0, 1)
  )
  equal(
    parts.find(part => part.type === 'timeZoneName')?.value,
    'GMT-٤:٥٦:٠٢',
    'localized historical offset seconds'
  )
}
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
