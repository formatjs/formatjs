import '@formatjs/intl-pluralrules/polyfill-force.js'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import ListFormat from '@formatjs/intl-listformat'
import {DurationFormat as Reference} from '@formatjs/intl-durationformat'
import type {DurationFormatOptions} from '@formatjs/intl-durationformat'
const Native = (Intl as any).DurationFormat
const fixtures = (globalThis as any).__DURATION_FIXTURES as {
  locales: string[]
  numbers: string[]
  lists: string[]
  rawLists: any[]
  plurals: any[]
}
Object.defineProperty(Intl, 'NumberFormat', {
  value: NumberFormat,
  writable: true,
  configurable: true,
})
Object.defineProperty(Intl, 'ListFormat', {
  value: ListFormat,
  writable: true,
  configurable: true,
})
let assertions = 0,
  cases = 0
function check(value: unknown, message: string): void {
  assertions++
  if (!value) throw new Error(message)
}
function equal(actual: unknown, expected: unknown, message: string): void {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    message + ': ' + JSON.stringify({actual, expected})
  )
}
function safely(callback: () => unknown): unknown {
  try {
    return callback()
  } catch (error) {
    return {error: (error as Error).name}
  }
}
function sameFailure(
  callback: () => unknown,
  expected: unknown,
  message: string
): void {
  let actual: unknown
  try {
    callback()
  } catch (error) {
    actual = error
  }
  check(actual === expected, message)
}
const fields = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
]
const readOrder = [
  'days',
  'hours',
  'microseconds',
  'milliseconds',
  'minutes',
  'months',
  'nanoseconds',
  'seconds',
  'weeks',
  'years',
]
check(
  typeof Native === 'function' && Native.polyfilled,
  'native DurationFormat installed'
)
equal(
  Native.supportedLocalesOf(['en', 'fr', 'zz']),
  Reference.supportedLocalesOf(['en', 'fr', 'zz']),
  'static availability before dependency packs'
)
equal(
  [...Native.availableLocales],
  [...Reference.availableLocales],
  'static locale order'
)
const early = new Native('en', {style: 'digital'}),
  earlyReference = new Reference('en', {style: 'digital'})
equal(
  early.resolvedOptions(),
  earlyReference.resolvedOptions(),
  'configuration without dependency data'
)
equal(
  safely(() => early.format({seconds: 1})),
  safely(() => earlyReference.format({seconds: 1})),
  'missing number dependency'
)
equal(
  safely(() => new Native('en').format({seconds: 0})),
  safely(() => new Reference('en').format({seconds: 0})),
  'empty output still needs list dependency'
)
function duringStyle(Constructor: any, load: () => void): any {
  return new Constructor('en', {
    numberingSystem: 'arab',
    get style() {
      load()
      return 'digital'
    },
  })
}
const nativeSnapshot = duringStyle(Native, () =>
  Native.__addNumberFormatData(fixtures.numbers[0])
)
const referenceSnapshot = duringStyle(Reference, () =>
  NumberFormat.__addLocaleData(JSON.parse(fixtures.numbers[0]))
)
equal(
  nativeSnapshot.resolvedOptions(),
  referenceSnapshot.resolvedOptions(),
  'resolution before style getter dependency load'
)
equal(
  nativeSnapshot.resolvedOptions().numberingSystem,
  'latn',
  'pre-load resolution snapshot'
)
for (let index = 0; index < fixtures.locales.length; index++) {
  ;(Intl.PluralRules as unknown as typeof PluralRules).__addLocaleData(
    fixtures.plurals[index]
  )
  NumberFormat.__addLocaleData(JSON.parse(fixtures.numbers[index]))
  ListFormat.__addLocaleData(fixtures.rawLists[index])
  Native.__addNumberFormatData(fixtures.numbers[index])
  Native.__addListFormatData(fixtures.lists[index])
}
equal(
  nativeSnapshot.format({seconds: 1}),
  referenceSnapshot.format({seconds: 1}),
  'snapshot format after data load'
)
equal(
  early.format({seconds: 1, milliseconds: 473}),
  earlyReference.format({seconds: 1, milliseconds: 473}),
  'late dependency data'
)
const values = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 3, 4, 5, 6, 7, 473, 456, 789],
  [0, 0, 0, 0, 0, 0, 1, 473, 0, 0],
  [0, 0, 0, 0, 1, 0, 2, 0, 0, 0],
  [0, 0, 0, 0, 10000, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1e18 + 100, 123],
  [0, 0, 0, 0, 0, 0, 2 ** 53 - 1, 999, 999, 999],
]
const profiles: DurationFormatOptions[] = [
  ...(['long', 'short', 'narrow', 'digital'] as const).map(style => ({style})),
  ...[0, 1, 3, 6, 9].map(fractionalDigits => ({
    style: 'digital' as const,
    fractionalDigits,
  })),
  {hours: 'numeric', minutesDisplay: 'auto', secondsDisplay: 'auto'},
  {
    style: 'digital',
    hoursDisplay: 'auto',
    minutesDisplay: 'auto',
    secondsDisplay: 'auto',
  },
  {seconds: 'long', milliseconds: 'numeric', fractionalDigits: 3},
  {milliseconds: 'short', microseconds: 'numeric', fractionalDigits: 6},
  {microseconds: 'long', nanoseconds: 'numeric'},
  {years: 'long', yearsDisplay: 'always'},
  {style: 'digital', numberingSystem: 'arab'},
  {style: 'digital', numberingSystem: 'hanidec', fractionalDigits: 3},
]
for (const locale of fixtures.locales)
  for (const options of profiles) {
    const model = new Native(locale, options),
      reference = new Reference(locale, options)
    const context = JSON.stringify({locale, options})
    equal(
      model.resolvedOptions(),
      reference.resolvedOptions(),
      'resolved ' + context
    )
    equal(
      Object.keys(model.resolvedOptions()),
      Object.keys(reference.resolvedOptions()),
      'resolved order'
    )
    for (const unsigned of values)
      for (const sign of [1, -1]) {
        const record: Record<string, number> = {}
        for (let index = 0; index < fields.length; index++)
          record[fields[index]] = unsigned[index] * sign
        equal(
          model.format(record),
          reference.format(record),
          'format ' + context + ' ' + JSON.stringify(record)
        )
        const parts = model.formatToParts(record)
        equal(parts, reference.formatToParts(record), 'parts ' + context)
        equal(
          parts.map((part: any) => part.value).join(''),
          model.format(record),
          'parts concatenate'
        )
        for (const part of parts)
          equal(
            Object.keys(part),
            part.unit ? ['type', 'value', 'unit'] : ['type', 'value'],
            'part order'
          )
        cases++
      }
  }
for (const style of ['long', 'short', 'narrow', 'digital'])
  for (const field of fields)
    for (const value of [
      'long',
      'short',
      'narrow',
      'numeric',
      '2-digit',
      'fractional',
      '\ud800',
    ])
      for (const display of [undefined, 'auto', 'always']) {
        const options = {
          style,
          [field]: value,
          [field + 'Display']: display,
        } as DurationFormatOptions
        equal(
          safely(() => new Native('en', options).resolvedOptions()),
          safely(() => new Reference('en', options).resolvedOptions()),
          'option propagation ' + JSON.stringify(options)
        )
        cases++
      }
for (const localeMatcher of ['lookup', 'best fit'] as const)
  for (const locales of [
    [],
    ['zz'],
    ['fr-XX'],
    ['en-u-nu-arab', 'en-u-nu-deva'],
    ['zz-u-nu-arab', 'fr-u-nu-deva'],
  ])
    for (const numberingSystem of [
      undefined,
      'latn',
      'ARAB',
      'deva',
      'roman',
      'unknown',
      '',
      'ab',
      'latn\n',
      '\ud800',
    ]) {
      const options = {localeMatcher, numberingSystem}
      equal(
        safely(() => new Native(locales, options).resolvedOptions()),
        safely(() => new Reference(locales, options).resolvedOptions()),
        'locale negotiation'
      )
      equal(
        safely(() => Native.supportedLocalesOf(locales, {localeMatcher})),
        safely(() => Reference.supportedLocalesOf(locales, {localeMatcher})),
        'supported locales'
      )
      cases++
    }
function reads(Constructor: any, override: Record<string, unknown>): unknown {
  const events: string[] = []
  const options = new Proxy(override, {
    get(target, key) {
      events.push(String(key))
      return Reflect.get(target, key)
    },
  })
  const result = safely(() => new Constructor('en', options).resolvedOptions())
  return {events, result}
}
for (const options of [
  {},
  {years: 'numeric'},
  {hours: 'numeric', minutes: 'long'},
  {milliseconds: 'numeric', millisecondsDisplay: 'always'},
  {fractionalDigits: 10},
  {numberingSystem: 'ab'},
  {localeMatcher: 'bad'},
])
  equal(
    reads(Native, options),
    reads(Reference, options),
    'constructor getter order'
  )
function recordReads(
  Constructor: any,
  override: Record<string, unknown>
): unknown {
  const events: string[] = []
  const input = new Proxy(override, {
    get(target, key) {
      events.push(String(key))
      return Reflect.get(target, key)
    },
  })
  return {
    result: safely(() =>
      new Constructor('en', {style: 'digital'}).format(input)
    ),
    events,
  }
}
for (const input of [
  {seconds: 1},
  {days: NaN},
  {microseconds: 1.5},
  {days: 1e300, seconds: 1},
  {days: 1, seconds: -1},
  {days: 1n},
  {days: Symbol()},
  {},
])
  equal(
    recordReads(Native, input),
    recordReads(Reference, input),
    'duration getter/coercion order'
  )
equal(
  (recordReads(Native, {seconds: 1}) as any).events,
  readOrder,
  'ordinary record canonical read order'
)
const model = new Native('en', {style: 'digital'}),
  reference = new Reference('en', {style: 'digital'})
for (const input of [
  null,
  undefined,
  true,
  1,
  Symbol(),
  1n,
  '',
  'invalid',
  {},
  {seconds: null},
  {seconds: '2'},
  {
    seconds: {
      valueOf() {
        return 3
      },
    },
  },
  {seconds: Infinity},
  {seconds: 1, nanoseconds: -1},
  {seconds: 2 ** 53},
  {years: 2 ** 32},
])
  equal(
    safely(() => model.format(input)),
    safely(() => reference.format(input as any)),
    'input rejection/coercion'
  )
for (const method of ['format', 'formatToParts', 'resolvedOptions']) {
  for (const receiver of [
    undefined,
    null,
    1,
    {},
    Object.create(Native.prototype),
  ]) {
    let touched = false
    const value = {
      get seconds() {
        touched = true
        return 1
      },
    }
    equal(
      safely(() => Native.prototype[method].call(receiver, value)),
      {error: 'TypeError'},
      'invalid receiver'
    )
    check(!touched, 'brand check before duration getters')
  }
  check(
    !Object.hasOwn(Native.prototype[method], 'prototype'),
    'method nonconstructible'
  )
  equal(
    Native.prototype[method].length,
    method === 'resolvedOptions' ? 0 : 1,
    'method length'
  )
}
equal(Native.length, 0, 'constructor length')
equal(Native.supportedLocalesOf.length, 1, 'supported length')
equal(
  Object.prototype.toString.call(model),
  '[object Intl.DurationFormat]',
  'toStringTag'
)
class Child extends Native {
  constructor(locales?: unknown, options?: unknown) {
    super(locales, options)
  }
}
check(new Child('en') instanceof Child, 'subclass prototype')
equal(
  safely(() => Native('en')),
  {error: 'TypeError'},
  'requires new'
)
const sentinel = {identity: 'duration getter'}
sameFailure(
  () =>
    model.format({
      get seconds() {
        throw sentinel
      },
    }),
  sentinel,
  'duration exception identity'
)
sameFailure(
  () =>
    new Native('en', {
      get hours() {
        throw sentinel
      },
    }),
  sentinel,
  'option exception identity'
)
sameFailure(
  () =>
    model.format({
      seconds: {
        valueOf() {
          throw sentinel
        },
      },
    }),
  sentinel,
  'coercion exception identity'
)
const temporal = (globalThis as any).Temporal
check(
  !!temporal?.Duration,
  'real Temporal implementation loaded before installation'
)
for (const text of [
  'PT1H',
  '-PT1H2M3.004005006S',
  'P1Y2M3W4DT5H6M7.008009001S',
]) {
  const value = temporal.Duration.from(text)
  equal(model.format(text), reference.format(text), 'Temporal duration string')
  equal(
    model.formatToParts(value),
    reference.formatToParts(value),
    'Temporal duration brand'
  )
  cases++
}
const temporalValue = temporal.Duration.from('PT1H2M3.004005006S')
const yearDescriptor = Object.getOwnPropertyDescriptor(
  temporal.Duration.prototype,
  'years'
)!
const from = temporal.Duration.from
try {
  Object.defineProperty(temporal.Duration.prototype, 'years', {
    configurable: true,
    get() {
      throw sentinel
    },
  })
  temporal.Duration.from = () => {
    throw sentinel
  }
  equal(
    model.format(temporalValue),
    reference.format(temporalValue),
    'captured Temporal getters'
  )
  equal(
    model.format('PT1H'),
    reference.format('PT1H'),
    'captured Temporal from'
  )
} finally {
  Object.defineProperty(temporal.Duration.prototype, 'years', yearDescriptor)
  temporal.Duration.from = from
}
const numberDescriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!,
  listDescriptor = Object.getOwnPropertyDescriptor(Intl, 'ListFormat')!
try {
  Object.defineProperty(Intl, 'NumberFormat', {
    configurable: true,
    get() {
      throw sentinel
    },
  })
  Object.defineProperty(Intl, 'ListFormat', {
    configurable: true,
    get() {
      throw sentinel
    },
  })
  equal(
    model.format({hours: 1, seconds: 2}),
    '1:00:02',
    'rendering independent of public JS formatter callbacks'
  )
} finally {
  Object.defineProperty(Intl, 'NumberFormat', numberDescriptor)
  Object.defineProperty(Intl, 'ListFormat', listDescriptor)
}
print(
  JSON.stringify({
    type: 'DurationFormat-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
declare function print(value: string): void
