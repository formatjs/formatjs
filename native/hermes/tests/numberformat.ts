import '@formatjs/intl-pluralrules/polyfill-force.js'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import {NumberFormat as Reference} from '@formatjs/intl-numberformat'
type NumberFormatOptions = NonNullable<
  ConstructorParameters<typeof Reference>[1]
>

const Native = Intl.NumberFormat as any
const fixtures = (globalThis as any).__NUMBER_FIXTURES as {
  packs: string[]
  plurals: any[]
}
let assertions = 0,
  cases = 0
const stringify = JSON.stringify
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
function throws(callback: () => unknown, kind: any, message: string): void {
  let error: unknown
  try {
    callback()
  } catch (caught) {
    error = caught
  }
  check(error instanceof kind, message)
}
check(
  typeof Native === 'function' && Native.polyfilled,
  'Rust NumberFormat installed'
)
equal(Native.supportedLocalesOf(['en', 'fr']), [], 'no implicit locale data')
const plural = Intl.PluralRules as unknown as typeof PluralRules
for (const data of fixtures.plurals) plural.__addLocaleData(data)
for (const pack of fixtures.packs) {
  Native.__addLocaleData(pack)
  Reference.__addLocaleData(JSON.parse(pack))
}
for (const Constructor of [Native, Reference]) {
  const receiver = Object.create(Constructor.prototype)
  check(
    Constructor.call(receiver, 'en', {minimumFractionDigits: 2}) === receiver,
    'legacy receiver identity'
  )
  const symbol = Object.getOwnPropertySymbols(receiver)[0]
  const descriptor = Object.getOwnPropertyDescriptor(receiver, symbol)!
  check(descriptor.value instanceof Constructor, 'legacy fallback formatter')
  check(
    !descriptor.writable && !descriptor.enumerable && !descriptor.configurable,
    'legacy fallback descriptor'
  )
  equal(receiver.format('1.00'), '1.00', 'legacy format source precision')
  equal(
    receiver.resolvedOptions().minimumFractionDigits,
    2,
    'legacy resolved options'
  )
  throws(() => receiver.formatToParts(1), TypeError, 'legacy parts brand')
  throws(() => receiver.formatRange(1, 2), TypeError, 'legacy range brand')
  throws(
    () => receiver.formatRangeToParts(1, 2),
    TypeError,
    'legacy range parts brand'
  )
  throws(
    () => Constructor.call(receiver, 'en'),
    TypeError,
    'legacy repeated initialization'
  )
  const initialized = new Constructor('en', {minimumFractionDigits: 1})
  const bound = initialized.format
  Constructor.call(initialized, 'en', {minimumFractionDigits: 2})
  check(initialized.format === bound, 'legacy keeps existing bound format')
  equal(initialized.format(1), '1.0', 'legacy keeps existing slots')
}
const values = [
  0,
  -0,
  1,
  2,
  -1.25,
  1.23456,
  999.9995,
  12345.678,
  1e6,
  1e-7,
  1e-300,
  NaN,
  Infinity,
  -Infinity,
  '9007199254740993.125',
  9007199254740993n,
  ' 0x20000000000001 ',
  '1.00',
  '001.00',
  '1.20e1',
  '1.20e-1',
  '0.00e1',
  '-0.00',
  '1e-9999',
  '-1e-9999',
  '0e-99999999999999999999999',
  '1.000e9999',
  '1000',
  '1.200e3',
]
function compare(
  locale: string | string[],
  options: NumberFormatOptions,
  inputs: readonly any[] = values,
  ranges = false
): void {
  const model = new Native(locale, options)
  const reference = new Reference(locale, options)
  const description = stringify({locale, options})
  equal(
    model.resolvedOptions(),
    reference.resolvedOptions(),
    'TS resolved ' + description
  )
  check(model.format === model.format, 'cached bound format')
  for (const input of inputs) {
    equal(
      model.format(input),
      reference.format(input),
      'TS format ' + description + ' ' + String(input)
    )
    equal(
      model.formatToParts(input),
      reference.formatToParts(input),
      'TS parts ' + description + ' ' + String(input)
    )
    cases++
  }
  if (ranges)
    for (const [start, end] of [
      [1, 2],
      ['1', '1.00'],
      ['1.0', '1.00'],
      ['0.00', '-0.00'],
      ['1.00', '1.00'],
      [2.999, 3],
      [1234, 5678],
      [-2, -1],
      [-1, 1],
    ]) {
      equal(
        model.formatRange(start, end),
        reference.formatRange(start, end),
        'TS range ' + description
      )
      equal(
        model.formatRangeToParts(start, end),
        reference.formatRangeToParts(start, end),
        'TS range parts ' + description
      )
    }
}
const styles: NumberFormatOptions[] = [
  {},
  {style: 'percent'},
  {style: 'currency', currency: 'USD'},
  {style: 'currency', currency: 'JPY'},
  {
    style: 'currency',
    currency: 'CHF',
    currencyDisplay: 'code',
    currencySign: 'accounting',
  },
  {style: 'currency', currency: 'USD', currencyDisplay: 'name'},
  {style: 'unit', unit: 'meter', unitDisplay: 'long'},
  {style: 'unit', unit: 'kilometer-per-hour'},
  {notation: 'compact'},
  {notation: 'compact', compactDisplay: 'long'},
  {notation: 'scientific'},
  {notation: 'engineering'},
  {trailingZeroDisplay: 'stripToMinimum'},
  {minimumFractionDigits: 2, trailingZeroDisplay: 'stripToMinimum'},
]
for (const locale of [
  'en',
  'fr',
  'de',
  'pl',
  'hi',
  'ar',
  'ja',
  'zh',
  'ko',
  'ru',
  'bn',
  'sw',
  'lv',
  'sr-Latn',
])
  for (const options of styles) compare(locale, options, values, true)
for (const roundingMode of [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
] as const)
  for (const signDisplay of [
    'auto',
    'always',
    'never',
    'exceptZero',
    'negative',
  ] as const)
    for (const precision of [
      {maximumFractionDigits: 2},
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        roundingIncrement: 5 as const,
      },
      {minimumSignificantDigits: 2, maximumSignificantDigits: 3},
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        maximumSignificantDigits: 3,
        roundingPriority: 'morePrecision' as const,
      },
    ])
      compare('en', {...precision, roundingMode, signDisplay}, [
        0,
        -0,
        1.025,
        -1.025,
        2.675,
        -2.675,
        0.004,
        -0.004,
        999.995,
        NaN,
        Infinity,
      ])
const systems = JSON.parse(fixtures.packs[0]).data.nu as string[]
for (const numberingSystem of systems)
  for (const notation of ['standard', 'scientific'] as const)
    compare('en', {numberingSystem, notation}, [
      0,
      -1.25,
      12345.678,
      1e-7,
      1e6,
      Infinity,
    ])
for (const locale of [
  'en',
  'fr',
  'ar',
  'ru',
  'pl',
  'cy',
  'sl',
  'lv',
  'ja',
  'bn',
])
  for (const unit of [
    'meter',
    'day',
    'liter-per-kilometer',
    'kilometer-per-hour',
    'percent',
    'celsius',
    'microsecond',
    'nanosecond',
  ])
    for (const unitDisplay of ['long', 'short', 'narrow'] as const)
      compare(locale, {style: 'unit', unit, unitDisplay}, [0, 1, 2, 1.25, -3])
for (const locale of ['en', 'fr', 'ar', 'ja', 'hi', 'de'])
  for (const currency of ['USD', 'JPY', 'BHD', 'CLF', 'MGA', 'XXX', 'ZZZ'])
    for (const currencyDisplay of [
      'code',
      'symbol',
      'narrowSymbol',
      'name',
    ] as const)
      compare(
        locale,
        {style: 'currency', currency, currencyDisplay},
        [0, -1, 1.23456, 12345]
      )
for (const notation of ['scientific', 'engineering'] as const)
  compare(
    'en',
    {
      notation,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      roundingIncrement: 5,
    },
    [1234, 0.0001234, -1234]
  )
for (const options of [
  {maximumSignificantDigits: 3},
  {notation: 'scientific'},
  {notation: 'engineering'},
  {trailingZeroDisplay: 'stripToMinimum'},
  {minimumFractionDigits: 2, trailingZeroDisplay: 'stripToMinimum'},
  {useGrouping: false},
] satisfies NumberFormatOptions[])
  compare('en', options, [
    BigInt('1234567890'.repeat(100)),
    BigInt('9'.repeat(400)),
    1e-300,
    '1.' + '0'.repeat(99) + '5',
  ])

for (const [locale, options] of [
  ['en-u-nu-arab', {}],
  ['en-u-nu-arab', {numberingSystem: 'latn'}],
  ['en-u-nu-arab', {numberingSystem: 'arab'}],
  ['en-u-nu-foobar', {}],
  ['en', {numberingSystem: 'foobar'}],
  ['en', {numberingSystem: 'LATN'}],
  ['fr-u-ca-buddhist-nu-thai', {}],
  ['sr-Latn-u-nu-arab', {}],
  [['zz', 'fr-u-nu-arab'], {}],
  [['en-u-nu-arab', 'en-u-nu-thai'], {localeMatcher: 'lookup'}],
  [['en-u-nu-arab', 'en-u-nu-thai'], {localeMatcher: 'best fit'}],
] satisfies [string | string[], NumberFormatOptions][])
  compare(locale, options, [0, 1.25, -12.5, 12345])

const model = Native('en')
check(model instanceof Native, 'callable constructor')
check(Native.call(model, 'fr') === model, 'legacy call preserves receiver')
equal(
  model.resolvedOptions().locale,
  'en',
  'legacy call preserves original locale'
)
class Derived extends Native {
  constructor(locale: string) {
    super(locale)
  }
}
check(new Derived('en') instanceof Derived, 'subclass prototype')
check(
  Object.prototype.toString.call(model) === '[object Intl.NumberFormat]',
  'toStringTag'
)
const bound = model.format
check(
  !Object.prototype.hasOwnProperty.call(bound, 'prototype'),
  'bound format not constructor'
)
throws(() => new bound(1), TypeError, 'bound format rejects construction')
equal(bound.call(null, 1.5), '1.5', 'bound receiver ignored')
check(bound.name === '' && bound.length === 1, 'bound function metadata')
Object.setPrototypeOf(model, null)
equal(bound(1.5), '1.5', 'bound format survives prototype changes')
for (const name of [
  'formatToParts',
  'formatRange',
  'formatRangeToParts',
  'resolvedOptions',
]) {
  const method = Native.prototype[name]
  check(
    !Object.prototype.hasOwnProperty.call(method, 'prototype'),
    'method not constructor ' + name
  )
  throws(() => new method(), TypeError, 'method construction ' + name)
  for (const receiver of [
    undefined,
    null,
    {},
    Object.create(Native.prototype),
    new Proxy(new Native('en'), {}),
  ]) {
    let reads = 0
    const value = {
      [Symbol.toPrimitive]() {
        reads++
        return 1
      },
    }
    throws(
      () => method.call(receiver, value, value),
      TypeError,
      'receiver brand ' + name
    )
    equal(reads, 0, 'brand before coercion ' + name)
  }
}
const formatGetter = Object.getOwnPropertyDescriptor(
  Native.prototype,
  'format'
)!.get!
throws(
  () => formatGetter.call(Object.create(Native.prototype)),
  TypeError,
  'format getter brand'
)
for (const method of ['formatRange', 'formatRangeToParts']) {
  let reads = 0
  const value = {
    [Symbol.toPrimitive]() {
      reads++
      return 1
    },
  }
  throws(
    () => new Native('en')[method](value, undefined),
    TypeError,
    'missing endpoint ' + method
  )
  equal(reads, 0, 'missing endpoint before coercion')
  const order: string[] = []
  const first = {
    [Symbol.toPrimitive](hint: string) {
      order.push('start:' + hint)
      return NaN
    },
  }
  const last = {
    [Symbol.toPrimitive](hint: string) {
      order.push('end:' + hint)
      return 2
    },
  }
  throws(
    () => new Native('en')[method](first, last),
    RangeError,
    'NaN endpoint ' + method
  )
  equal(
    order,
    ['start:number', 'end:number'],
    'both endpoints converted before NaN rejection'
  )
}
for (const input of [
  Symbol('value'),
  {
    [Symbol.toPrimitive]() {
      return Symbol('value')
    },
  },
]) {
  throws(() => new Native('en').format(input), TypeError, 'Symbol format')
  throws(() => new Native('en').formatToParts(input), TypeError, 'Symbol parts')
}
const rawInputs = [
  undefined,
  null,
  true,
  false,
  '',
  '\ufeff0o17\u2029',
  '0b101',
  '-0',
  '-1e-99999',
  '1e99999',
  'invalid',
  '\ud800',
]
compare('en', {}, rawInputs)
const calls: string[] = []
const exotic = {
  [Symbol.toPrimitive](hint: string) {
    calls.push(hint)
    return '9007199254740993.125'
  },
}
equal(
  new Native('en').format(exotic),
  new Reference('en').format('9007199254740993.125'),
  'exact object conversion'
)
equal(calls, ['number'], 'ToPrimitive hint')

const optionKeys = [
  'localeMatcher',
  'numberingSystem',
  'style',
  'currency',
  'currencyDisplay',
  'currencySign',
  'unit',
  'unitDisplay',
  'notation',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'roundingIncrement',
  'roundingMode',
  'roundingPriority',
  'trailingZeroDisplay',
  'compactDisplay',
  'useGrouping',
  'signDisplay',
]
function observed(
  Constructor: any,
  values: any
): {events: string[]; error: string} {
  const events: string[] = []
  const opts = new Proxy(Object.create(null), {
    get(_target, key) {
      events.push(String(key))
      return values[key]
    },
  })
  let error = ''
  try {
    new Constructor('en', opts)
  } catch (caught) {
    error = (caught as Error).name
  }
  return {events, error}
}
equal(
  observed(Native, {}),
  {events: optionKeys, error: ''},
  'option getter order'
)
for (const options of [
  {numberingSystem: 'bad!'},
  {style: 'bogus'},
  {style: 'currency'},
  {currency: 'us'},
  {currencyDisplay: 'bad'},
  {currencySign: 'bad'},
  {unit: 'MILE'},
  {style: 'unit'},
  {unitDisplay: 'bad'},
  {notation: 'bad'},
  {minimumIntegerDigits: 0},
  {roundingIncrement: 3},
  {roundingIncrement: 2, minimumFractionDigits: 1, maximumFractionDigits: 2},
  {roundingMode: 'bad'},
  {roundingPriority: 'bad'},
  {trailingZeroDisplay: 'bad'},
  {minimumFractionDigits: 3, maximumFractionDigits: 2},
  {maximumSignificantDigits: 0},
  {roundingIncrement: 5, maximumSignificantDigits: 3},
  {compactDisplay: 'bad'},
  {useGrouping: 'bad'},
  {signDisplay: 'bad'},
])
  equal(
    observed(Native, options),
    observed(Reference, options),
    'ordered option failure ' + stringify(options)
  )
let inactive = 0
const ignored = {
  valueOf() {
    inactive++
    throw new Error('inactive precision coerced')
  },
}
equal(
  new Native('en', {
    maximumSignificantDigits: 2,
    minimumFractionDigits: ignored,
  }).format(1.234),
  '1.2',
  'inactive precision'
)
equal(inactive, 0, 'inactive precision not coerced')
let prototypeReads = 0
const newTarget = new Proxy(function () {}, {
  get(target, key, receiver) {
    if (key === 'prototype') prototypeReads++
    return Reflect.get(target, key, receiver)
  },
})
Reflect.construct(Native, ['en'], newTarget)
equal(prototypeReads, 1, 'newTarget.prototype read once')
let localesRead = false
const badTarget = new Proxy(function () {}, {
  get(target, key, receiver) {
    if (key === 'prototype') throw new Error('prototype')
    return Reflect.get(target, key, receiver)
  },
})
throws(
  () =>
    Reflect.construct(
      Native,
      [
        {
          get length() {
            localesRead = true
            return 0
          },
        },
      ],
      badTarget
    ),
  Error,
  'prototype failure'
)
check(!localesRead, 'prototype before locales')

// Locale selection must survive a replacement registered by a later option getter.
const replacement = JSON.parse(fixtures.packs[0])
replacement.data.numbers.symbols.latn.decimal = ','
const capture = new Native('en', {
  get style() {
    Native.__addLocaleData(stringify(replacement))
    return 'decimal'
  },
})
equal(capture.format(1.5), '1.5', 'locale captured before style getter')
equal(
  new Native('en').format(1.5),
  '1,5',
  'replacement applies to later instance'
)
Native.__addLocaleData(fixtures.packs[0])
const unitModel = new Native('en', {
  style: 'unit',
  unit: 'meter',
  unitDisplay: 'long',
})
Native.__addUnitData(
  'en',
  stringify({
    simple: {
      meter: {
        long: {one: '{0} rod', other: '{0} rods'},
        short: {other: '{0}r'},
        narrow: {other: '{0}r'},
      },
    },
    compound: {},
  })
)
equal(unitModel.format(2), '2 rods', 'unit updates reach existing model')
Native.__addLocaleData(fixtures.packs[0])
const fresh = new Native('en')
const firstOptions = fresh.resolvedOptions()
firstOptions.locale = 'changed'
equal(fresh.resolvedOptions().locale, 'en', 'fresh resolved object')
print(
  stringify({
    type: 'NumberFormat-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
declare function print(value: string): void
