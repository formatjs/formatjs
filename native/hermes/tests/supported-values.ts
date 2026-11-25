import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'

declare function print(value: string): void

const candidate = Intl.supportedValuesOf as (key?: unknown) => string[]
const reference = supportedValuesOf as (key?: unknown) => string[]
const keys = [
  'calendar',
  'collation',
  'currency',
  'numberingSystem',
  'timeZone',
  'unit',
] as const
let assertions = 0

function check(condition: boolean, message: string) {
  assertions++
  if (!condition) throw new Error(message)
}

function equal(actual: unknown, expected: unknown, message: string) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: ${JSON.stringify(actual)}`
  )
}

function outcome(method: typeof candidate, key?: unknown) {
  try {
    return {values: method(key)}
  } catch (error) {
    return {error: (error as Error).name}
  }
}

for (const key of keys) {
  const expected = reference(key)
  const actual = candidate(key)
  check(expected.length > 0, `Empty reference backend for ${key}`)
  check(Array.isArray(actual), `Non-array ${key}`)
  equal(actual, expected, `Differential ${key}`)
  equal(actual, [...actual].sort(), `Sorted ${key}`)
  equal(actual, [...new Set(actual)], `Unique ${key}`)
  actual.length = 0
  equal(candidate(key), expected, `Fresh result ${key}`)
}

for (const key of [
  '',
  'invalid',
  'Calendar',
  'calendars',
  'numberingsystem',
  'timezone',
  'unit\0',
  undefined,
  null,
  true,
  42,
  NaN,
  Infinity,
  1n,
  Symbol('unit'),
]) {
  equal(
    outcome(candidate, key),
    outcome(reference, key),
    'Invalid/primitive key'
  )
}
for (const key of [new String('unit'), ['unit']]) {
  equal(candidate(key), reference(key), 'Object key')
}

function observableKey(
  method: typeof candidate,
  kind: 'primitive' | 'fallback'
) {
  const log: string[] = []
  const key =
    kind === 'primitive'
      ? {
          [Symbol.toPrimitive](hint: string) {
            log.push(hint)
            return 'unit'
          },
        }
      : {
          toString() {
            log.push('toString')
            return {}
          },
          valueOf() {
            log.push('valueOf')
            return 'unit'
          },
        }
  return {result: outcome(method, key), log}
}
for (const kind of ['primitive', 'fallback'] as const) {
  equal(
    observableKey(candidate, kind),
    observableKey(reference, kind),
    'Coercion order'
  )
}
equal(
  observableKey(candidate, 'primitive').log,
  ['string'],
  'Single string hint'
)
equal(
  observableKey(candidate, 'fallback').log,
  ['toString', 'valueOf'],
  'Ordinary string coercion'
)

for (const method of [candidate, reference]) {
  const sentinel = new Error('key coercion')
  for (const key of [
    {
      [Symbol.toPrimitive]() {
        throw sentinel
      },
    },
    {
      get [Symbol.toPrimitive]() {
        throw sentinel
      },
    },
    {
      toString() {
        throw sentinel
      },
    },
  ]) {
    let caught: unknown
    try {
      method(key)
    } catch (error) {
      caught = error
    }
    check(caught === sentinel, 'Preserve coercion exception identity')
  }
  equal(
    outcome(method, {
      [Symbol.toPrimitive]() {
        return {}
      },
    }),
    {error: 'TypeError'},
    'Nonprimitive coercion result'
  )
}

for (const receiver of [undefined, null, 123, Symbol(), {}]) {
  equal(candidate.call(receiver, 'unit'), reference('unit'), 'Ignored receiver')
}

// Support belongs to the current runtime, not a cached build-host snapshot.
const timezoneValues = candidate('timeZone')
const dateTimeResolved = Object.getOwnPropertyDescriptor(
  Intl.DateTimeFormat.prototype,
  'resolvedOptions'
)!
try {
  Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
    configurable: true,
    value() {
      throw new Error('Timezone enumeration read resolvedOptions')
    },
  })
  equal(
    candidate('timeZone'),
    timezoneValues,
    'Timezone support uses construction, not resolved spelling'
  )
  equal(
    reference('timeZone'),
    timezoneValues,
    'TS timezone support uses construction'
  )
} finally {
  Object.defineProperty(
    Intl.DateTimeFormat.prototype,
    'resolvedOptions',
    dateTimeResolved
  )
}

const dateTimeFormatDescriptor = Object.getOwnPropertyDescriptor(
  Intl,
  'DateTimeFormat'
)!
try {
  Object.defineProperty(Intl, 'DateTimeFormat', {value: undefined})
  equal(candidate('timeZone'), ['UTC'], 'Native UTC without DateTimeFormat')
  equal(reference('timeZone'), ['UTC'], 'TypeScript UTC without DateTimeFormat')
  equal(
    candidate('calendar'),
    ['iso8601'],
    'Native ISO calendar without DateTimeFormat'
  )
  equal(
    reference('calendar'),
    ['iso8601'],
    'TypeScript ISO calendar without DateTimeFormat'
  )
} finally {
  Object.defineProperty(Intl, 'DateTimeFormat', dateTimeFormatDescriptor)
}

class RegionalCalendarFormatter {
  constructor(
    private readonly locale: string,
    private readonly options?: Intl.DateTimeFormatOptions
  ) {}

  resolvedOptions() {
    if (this.locale === 'fa-u-ca-persian') return {calendar: 'persian'}
    if (this.locale === 'am-u-ca-ethioaa') return {calendar: 'ethioaa'}
    // The provider's default locale accepts Japanese calendar even when the
    // requested locale does not match and its Unicode extension is dropped.
    return {
      calendar: this.options?.calendar === 'japanese' ? 'japanese' : 'gregory',
    }
  }
}
class FailingCalendarMetadata extends RegionalCalendarFormatter {
  static [Symbol.for('@formatjs/intl-datetimeformat/availableCalendars')]() {
    throw new Error('Calendar metadata unavailable')
  }
}
const regionalCalendars = [
  'ethioaa',
  'gregory',
  'iso8601',
  'japanese',
  'persian',
]
try {
  for (const Formatter of [
    RegionalCalendarFormatter,
    FailingCalendarMetadata,
  ]) {
    Object.defineProperty(Intl, 'DateTimeFormat', {value: Formatter})
    equal(
      [outcome(candidate, 'calendar'), outcome(reference, 'calendar')],
      [{values: regionalCalendars}, {values: regionalCalendars}],
      `Calendar support with ${Formatter.name}`
    )
  }
} finally {
  Object.defineProperty(Intl, 'DateTimeFormat', dateTimeFormatDescriptor)
}

class FailingZoneMetadata {
  constructor(_locale: string, options: Intl.DateTimeFormatOptions) {
    if (options.timeZone !== 'America/New_York')
      throw new RangeError('Unsupported time zone')
  }

  static [Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone')]() {
    throw new Error('Time-zone metadata unavailable')
  }
}
try {
  Object.defineProperty(Intl, 'DateTimeFormat', {value: FailingZoneMetadata})
  const zones = ['America/New_York', 'UTC']
  equal(
    [outcome(candidate, 'timeZone'), outcome(reference, 'timeZone')],
    [{values: zones}, {values: zones}],
    'Time-zone support with failing metadata'
  )
} finally {
  Object.defineProperty(Intl, 'DateTimeFormat', dateTimeFormatDescriptor)
}

const numberFormatDescriptor = Object.getOwnPropertyDescriptor(
  Intl,
  'NumberFormat'
)!
const unitsBefore = candidate('unit')
try {
  Object.defineProperty(Intl, 'NumberFormat', {value: undefined})
  equal(candidate('unit'), unitsBefore, 'Units without a Rust formatter')
  equal(reference('unit'), unitsBefore, 'Units without a TS formatter')
} finally {
  Object.defineProperty(Intl, 'NumberFormat', numberFormatDescriptor)
}
equal(candidate('unit'), unitsBefore, 'Restored formatter support')

for (const [name, categories] of [
  ['DateTimeFormat', ['calendar', 'timeZone']],
  ['NumberFormat', ['unit', 'currency', 'numberingSystem']],
  ['Collator', ['collation']],
] as const) {
  const Constructor = Intl[name]
  const expected = categories.map(key => candidate(key))
  const constructor = Object.getOwnPropertyDescriptor(Intl, name)!
  const prototype = Constructor.prototype
  const methods =
    name === 'NumberFormat'
      ? ['resolvedOptions', 'format']
      : ['resolvedOptions']
  const descriptors = methods.map(method =>
    Object.getOwnPropertyDescriptor(prototype, method)!
  )
  const fail = {
    configurable: true,
    get() {
      throw new Error('Read public formatter property')
    },
  }
  let actual: string[][]
  try {
    Object.defineProperty(Intl, name, fail)
    for (const method of methods) Object.defineProperty(prototype, method, fail)
    actual = categories.map(key => candidate(key))
  } finally {
    Object.defineProperty(Intl, name, constructor)
    for (const [index, method] of methods.entries())
      Object.defineProperty(prototype, method, descriptors[index])
  }
  equal(actual, expected, `Retained ${name} operations`)
}

const arrayConstructor = Object.getOwnPropertyDescriptor(
  Array.prototype,
  'constructor'
)!
let firstValues: string[]
let secondValues: string[]
try {
  Object.defineProperty(Array.prototype, 'constructor', {
    configurable: true,
    get() {
      throw new Error('supportedValuesOf consulted Array.prototype.constructor')
    },
  })
  firstValues = candidate('unit')
  secondValues = candidate('unit')
} finally {
  Object.defineProperty(Array.prototype, 'constructor', arrayConstructor)
}
equal(firstValues, unitsBefore, 'Intrinsic array without species lookup')
equal(
  secondValues,
  unitsBefore,
  'Cached intrinsic array without species lookup'
)
check(firstValues !== secondValues, 'Separate intrinsic arrays')

const OriginalNumberFormat = Intl.NumberFormat
let hasChuvashData = false
class CurrencyNameFormatter extends OriginalNumberFormat {
  static polyfilled = true
  private readonly name: string

  static __addLocaleData() {
    hasChuvashData = true
  }

  constructor(locale?: string, options?: Intl.NumberFormatOptions) {
    super(locale, options)
    const code = options?.currency ?? ''
    this.name =
      code === 'USD'
        ? 'US dollar USD'
        : hasChuvashData && locale === 'cv' && code === 'XAD'
          ? 'ази шутлав динарӗ'
          : code
  }

  get format() {
    return () =>
      this.name === 'US dollar USD' ? `123 ${this.name}` : `123 (${this.name})`
  }

  formatToParts(): Intl.NumberFormatPart[] {
    return [
      {type: 'integer', value: '123'},
      {type: 'literal', value: this.name === 'US dollar USD' ? ' ' : ' ('},
      {type: 'currency', value: this.name},
      ...(this.name === 'US dollar USD'
        ? []
        : [{type: 'literal' as const, value: ')'}]),
    ]
  }
}
try {
  Intl.NumberFormat = CurrencyNameFormatter
  for (const enumerate of [candidate, reference])
    equal(enumerate('currency'), ['USD'], 'Currency names use currency parts')

  const original = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames')
  let hasName = false
  class CurrencyDisplayNames {
    constructor(private locale: string) {}

    static __addLocaleData() {
      hasName = true
    }

    of(code: string) {
      if (hasName && code === 'USD') return 'USD'
      if (hasName && this.locale === 'cv' && code === 'XAD')
        return 'ази шутлав динарӗ'
    }
  }
  try {
    Object.defineProperty(Intl, 'DisplayNames', {
      configurable: true,
      value: CurrencyDisplayNames,
    })
    for (const enumerate of [candidate, reference])
      equal(
        enumerate('currency'),
        [],
        'Currency support requires DisplayNames data'
      )
    CurrencyDisplayNames.__addLocaleData()
    for (const enumerate of [candidate, reference])
      equal(
        enumerate('currency'),
        ['USD'],
        'DisplayNames data refreshes currency support'
      )
    CurrencyNameFormatter.__addLocaleData()
    for (const enumerate of [candidate, reference])
      equal(
        enumerate('currency'),
        ['USD', 'XAD'],
        'Currency names outside English'
      )
  } finally {
    hasChuvashData = false
    if (original) Object.defineProperty(Intl, 'DisplayNames', original)
    else Reflect.deleteProperty(Intl, 'DisplayNames')
  }
} finally {
  Intl.NumberFormat = OriginalNumberFormat
}

let probes = 0
let hasCurrencyData = false
class NumberFormat extends CurrencyNameFormatter {
  constructor(locale?: string, options?: Intl.NumberFormatOptions) {
    super(locale, options)
    probes++
    if (!hasCurrencyData) throw new RangeError('No currency data')
  }

  static __addLocaleData() {
    hasCurrencyData = true
  }
}
try {
  Intl.NumberFormat = NumberFormat
  equal(candidate('currency'), [], 'Replacement starts without currency data')
  const first = probes
  equal(candidate('currency'), [], 'Cached formatter observations')
  check(probes === first, 'Reuses cached formatter observations')
  const savedLoader = NumberFormat.__addLocaleData
  Object.defineProperty(NumberFormat.prototype, 'resolvedOptions', {
    get() {
      throw new Error('Read public method on an uncached probe')
    },
  })
  savedLoader()
  equal(
    candidate('currency'),
    ['USD'],
    'Saved loader refreshes retained probes'
  )
} finally {
  Intl.NumberFormat = OriginalNumberFormat
}

{
  const required = candidate('numberingSystem')
  const names = [
    'NumberFormat',
    'DateTimeFormat',
    'RelativeTimeFormat',
  ] as const
  const originals = names.map(name =>
    Object.getOwnPropertyDescriptor(Intl, name)
  )
  class AlgorithmicFormatter {
    constructor(private locale: string) {}

    resolvedOptions() {
      const systems: Record<string, string> = {
        'en-u-nu-roman': 'roman',
        'ja-u-nu-jpan': 'jpan',
        'zh-Hant-u-nu-hant': 'hant',
        'he-u-nu-hebr': 'hebr',
      }
      return {numberingSystem: systems[this.locale] ?? 'latn'}
    }
  }
  try {
    for (const name of names.slice(0, 2))
      Object.defineProperty(Intl, name, {value: AlgorithmicFormatter})
    Object.defineProperty(Intl, 'RelativeTimeFormat', {
      value: undefined,
      configurable: true,
    })
    for (const enumerate of [candidate, reference])
      equal(
        enumerate('numberingSystem'),
        required,
        'Additional systems require every formatter'
      )

    Object.defineProperty(Intl, 'RelativeTimeFormat', {
      value: AlgorithmicFormatter,
    })
    for (const enumerate of [candidate, reference])
      equal(
        enumerate('numberingSystem'),
        [...required, 'roman', 'jpan', 'hant', 'hebr'].sort(),
        'Additional systems supported in their CLDR locales'
      )
  } finally {
    for (const [index, name] of names.entries()) {
      const original = originals[index]
      if (original) Object.defineProperty(Intl, name, original)
      else Reflect.deleteProperty(Intl, name)
    }
  }
}

const descriptor = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf')!
check(descriptor.value === candidate, 'Installed method')
check(descriptor.writable === true, 'Writable')
check(descriptor.enumerable === false, 'Non-enumerable')
check(descriptor.configurable === true, 'Configurable')
check(candidate.name === 'supportedValuesOf', 'Name')
check(candidate.length === 1, 'Length')
check(
  !Object.prototype.hasOwnProperty.call(candidate, 'prototype'),
  'No prototype'
)
let constructed = false
try {
  Reflect.construct(candidate, ['unit'])
} catch (error) {
  constructed = error instanceof TypeError
}
check(constructed, 'Not constructible')

print(
  JSON.stringify({
    type: 'supportedValuesOf-conformance',
    keys: keys.length,
    assertions,
    candidate: 'Rust JSI installed API',
    backend: 'TypeScript formatters',
  })
)
