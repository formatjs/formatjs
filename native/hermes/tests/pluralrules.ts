import {PluralRules as TypeScriptPluralRules} from '@formatjs/intl-pluralrules'

const root = globalThis as any
const Native = Intl.PluralRules as any
const fixtures = root.__PLURAL_FIXTURES as {packs: string[]; tsData: any[]}
let assertions = 0,
  cases = 0
function check(value: unknown, message: string) {
  assertions++
  if (!value) throw new Error(message)
}
function equal(actual: unknown, expected: unknown, message: string) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    message + ': ' + JSON.stringify({actual, expected})
  )
}
function throws(callback: () => unknown, kind: any, message: string) {
  let caught: unknown
  try {
    callback()
  } catch (error) {
    caught = error
  }
  check(caught instanceof kind, message)
}
check(
  typeof Native === 'function' && Native.polyfilled,
  'Rust PluralRules installed'
)
equal(Native.supportedLocalesOf(['en', 'fr']), [], 'no implicit data')
Native.__addLocaleData(fixtures.packs[0])

const largeText = '1' + '0'.repeat(9_998) + '3'
const large = BigInt(largeText)
equal(
  new Native('en', {type: 'ordinal'}).select(large),
  'few',
  'large BigInt bypasses Number overflow'
)
TypeScriptPluralRules.__addLocaleData(fixtures.tsData[0])
const existing = new Native('en')
equal(
  existing.select(largeText),
  'other',
  'large numeric string clamps to infinity'
)
equal(
  existing.select('\uD800'),
  'other',
  'malformed UTF-16 numeric string is NaN'
)
equal(existing.select(1), 'one', 'initial English instance')
equal(Native.supportedLocalesOf('fr'), [], 'French not loaded yet')
for (let index = 1; index < fixtures.packs.length; index++) {
  Native.__addLocaleData(fixtures.packs[index])
  TypeScriptPluralRules.__addLocaleData(fixtures.tsData[index])
}
equal(Native.supportedLocalesOf('fr-FR'), ['fr-FR'], 'late French support')
equal(new Native('fr').select(0), 'one', 'late French selection')
const localeObject = new Intl.Locale('fr-u-nu-arab')
localeObject.toString = () => {
  throw new Error('Locale brand must bypass overridden toString')
}
equal(
  new Native(localeObject).resolvedOptions().locale,
  'fr',
  'Locale intrinsic brand'
)
equal(existing.select(1), 'one', 'existing instance survives late load')
const replacement = JSON.parse(fixtures.packs[0])
replacement.cardinal = {}
replacement.ordinal = {}
Native.__addLocaleData(JSON.stringify(replacement))
equal(new Native('en').select(1), 'other', 'replacement affects new instance')
equal(existing.select(1), 'one', 'replacement preserves existing instance')
Native.__addLocaleData(fixtures.packs[0])

const configurations: any[] = [
  {},
  {minimumFractionDigits: 2},
  {maximumFractionDigits: 0},
  {minimumSignificantDigits: 3, maximumSignificantDigits: 4},
  {maximumSignificantDigits: 1},
  {
    maximumSignificantDigits: 2,
    maximumFractionDigits: 0,
    roundingPriority: 'morePrecision',
  },
  {
    maximumSignificantDigits: 2,
    maximumFractionDigits: 0,
    roundingPriority: 'lessPrecision',
  },
  {notation: 'compact'},
  {notation: 'compact', compactDisplay: 'long'},
  {minimumFractionDigits: 2, maximumFractionDigits: 2, roundingIncrement: 25},
  {minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger'},
  {minimumIntegerDigits: 21},
]
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
])
  configurations.push({roundingMode, maximumFractionDigits: 0})
const values: any[] = [
  undefined,
  null,
  true,
  false,
  0,
  -0,
  1,
  -1,
  1.005,
  2.5,
  -2.5,
  9.995,
  999.95,
  1000000,
  1e-7,
  NaN,
  Infinity,
  -Infinity,
  1n,
  9007199254740993n,
  '9007199254740993',
  '0x20000000000001',
  '.5',
  '1.',
  '1e+0',
  '1e-9999',
  '1e9999',
  '.',
  '1e3junk',
  ' \uFEFF ',
]
for (const locale of [
  'en',
  'fr',
  'ru',
  'ar',
  'lv',
  'pt',
  'pt-PT',
  'cy',
  'sl',
  'cs',
  'it',
  'es',
  'ja',
]) {
  for (const options of configurations)
    for (const type of ['cardinal', 'ordinal'] as const) {
      const native = new Native(locale, {...options, type}),
        reference = new TypeScriptPluralRules(locale, {...options, type})
      equal(
        native.resolvedOptions(),
        reference.resolvedOptions(),
        `${locale} resolved ${JSON.stringify(options)}`
      )
      for (const value of values) {
        cases++
        equal(
          native.select(value),
          reference.select(value),
          `${locale} ${type} select ${String(value)}`
        )
      }
      for (const [start, end] of [
        [-1, 1],
        [1, 2],
        [1.0001, 1.0002],
        [1n, 2n],
        ['0x1', '2'],
        [Infinity, 1],
        [Infinity, Infinity],
        [-Infinity, Infinity],
      ]) {
        cases++
        equal(
          native.selectRange(start, end),
          reference.selectRange(start as any, end as any),
          `${locale} ${type} range`
        )
      }
    }
}

equal(Native.length, 0, 'constructor length')
equal(Native.name, 'PluralRules', 'constructor name')
equal(Native.supportedLocalesOf.length, 1, 'supportedLocalesOf length')
const prototype = Native.prototype
for (const [name, length] of [
  ['select', 1],
  ['selectRange', 2],
  ['resolvedOptions', 0],
] as const) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name)!
  check(
    !descriptor.enumerable && descriptor.writable && descriptor.configurable,
    `${name} descriptor`
  )
  equal(prototype[name].name, name, `${name} name`)
  equal(prototype[name].length, length, `${name} length`)
  check(
    !Object.prototype.hasOwnProperty.call(prototype[name], 'prototype'),
    `${name} not constructable`
  )
  for (const receiver of [
    undefined,
    null,
    {},
    prototype,
    Object.create(prototype),
    new Proxy(existing, {}),
  ])
    throws(
      () => prototype[name].call(receiver),
      TypeError,
      `${name} receiver brand`
    )
}
check(
  !Object.getOwnPropertyDescriptor(Native, 'prototype')!.writable,
  'constructor prototype immutable'
)
check(
  Object.getPrototypeOf(prototype) === Object.prototype,
  'ordinary prototype'
)
equal(
  Object.prototype.toString.call(existing),
  '[object Intl.PluralRules]',
  'toStringTag'
)
throws(() => Native('en'), TypeError, 'must construct')
class Derived extends Native {
  constructor(...args: any[]) {
    super(...args)
  }
}
const derived = new Derived('en')
check(
  derived instanceof Derived && derived instanceof Native,
  'subclass prototype'
)
equal(derived.select(1), 'one', 'subclass brand')
let prototypeReads = 0
const NewTarget = new Proxy(function () {}, {
  get(target, key, receiver) {
    if (key === 'prototype') prototypeReads++
    return Reflect.get(target, key, receiver)
  },
})
const constructed = Reflect.construct(Native, ['en'], NewTarget)
equal(prototypeReads, 1, 'newTarget prototype read once')
equal(prototype.select.call(constructed, 1), 'one', 'custom newTarget brand')
function PrimitivePrototype() {}
PrimitivePrototype.prototype = 3 as any
check(
  Object.getPrototypeOf(
    Reflect.construct(Native, ['en'], PrimitivePrototype)
  ) === prototype,
  'primitive prototype fallback'
)

let log: string[] = []
throws(
  () =>
    new Native(
      {
        get length() {
          log.push('locale')
          throw new Error('locale marker')
        },
      },
      {
        get localeMatcher() {
          log.push('matcher')
          return 'lookup'
        },
      }
    ),
  Error,
  'locale access error'
)
equal(log, ['locale'], 'locales precede options')
log = []
throws(
  () =>
    new Native('en', {
      get type() {
        log.push('type')
        return 'invalid'
      },
      get notation() {
        log.push('notation')
        return 'standard'
      },
    }),
  RangeError,
  'bad type'
)
equal(log, ['type'], 'validate type before notation')
log = []
new Native('en', {
  minimumFractionDigits: {
    valueOf() {
      throw new Error('inactive fraction')
    },
  },
  maximumSignificantDigits: 2,
})
throws(
  () =>
    new Native('en', {
      minimumIntegerDigits: 0,
      get minimumFractionDigits() {
        log.push('fraction')
        return 2
      },
    }),
  RangeError,
  'minimum integer bounds'
)
equal(log, [], 'minimum integer fails before fraction getter')
log = []
throws(
  () =>
    new Native('en', {
      minimumSignificantDigits: {
        valueOf() {
          log.push('minimum')
          return 0
        },
      },
      maximumSignificantDigits: {
        valueOf() {
          log.push('maximum')
          return 2
        },
      },
    }),
  RangeError,
  'significant bounds'
)
equal(log, ['minimum'], 'minimum significant before maximum coercion')
log = []
const numeric = {
  [Symbol.toPrimitive](hint: string) {
    log.push(hint)
    return 1n
  },
}
equal(existing.select(numeric), 'one', 'BigInt primitive hook')
equal(log, ['number'], 'numeric primitive hint')
log = []
const observed = new Proxy(
  {
    valueOf() {
      log.push('call')
      return 1
    },
  },
  {
    has() {
      log.push('has')
      return false
    },
    get(target, key, receiver) {
      log.push(key === Symbol.toPrimitive ? 'primitive' : String(key))
      return Reflect.get(target, key, receiver)
    },
  }
)
equal(existing.select(observed), 'one', 'proxy numeric primitive')
equal(
  log,
  ['primitive', 'valueOf', 'call'],
  'ToPrimitive uses Get without HasProperty'
)
equal(
  existing.select({
    [Symbol.toPrimitive]: null,
    valueOf() {
      return 1
    },
  }),
  'one',
  'null exotic falls back'
)
const callable: any = function () {}
callable.valueOf = () => 1
equal(existing.select(callable), 'one', 'callable objects undergo ToPrimitive')
equal(
  new Native('fr').select({
    valueOf() {
      return null
    },
  }),
  'one',
  'null is primitive zero'
)
throws(() => existing.select(Symbol()), TypeError, 'Symbol mathematical value')
throws(
  () =>
    existing.select({
      [Symbol.toPrimitive]() {
        return () => 1
      },
    }),
  TypeError,
  'exotic cannot return function'
)
log = []
throws(
  () =>
    existing.selectRange(
      {
        valueOf() {
          log.push('start')
          return 1
        },
      },
      undefined
    ),
  TypeError,
  'missing end'
)
equal(log, [], 'undefined endpoint before any conversion')
log = []
throws(
  () =>
    existing.selectRange(
      {
        valueOf() {
          log.push('start')
          return NaN
        },
      },
      {
        valueOf() {
          log.push('end')
          return 2
        },
      }
    ),
  RangeError,
  'NaN range'
)
equal(log, ['start', 'end'], 'both endpoints precede NaN rejection')
const first = existing.resolvedOptions(),
  second = existing.resolvedOptions()
check(
  first !== second && first.pluralCategories !== second.pluralCategories,
  'fresh resolved values'
)
first.pluralCategories.length = 0
equal(second.pluralCategories, ['one', 'other'], 'unshared category arrays')

const saved = {
  parse: JSON.parse,
  stringify: JSON.stringify,
  create: Object.create,
  define: Object.defineProperty,
  apply: Reflect.apply,
  get: WeakMap.prototype.get,
  set: WeakMap.prototype.set,
  canonical: Intl.getCanonicalLocales,
  floor: Math.floor,
}
let captured: any
const poison = () => {
  throw new Error('tampered intrinsic')
}
try {
  JSON.parse = poison
  JSON.stringify = poison
  Object.create = poison
  Object.defineProperty = poison
  Reflect.apply = poison
  WeakMap.prototype.get = poison
  WeakMap.prototype.set = poison
  Intl.getCanonicalLocales = poison
  Math.floor = poison
  saved.define(Object.prototype, 'toJSON', {value: poison, configurable: true})
  saved.define(Object.prototype, 'get', {get: poison, configurable: true})
  const value = new Native('EN-us', {
    minimumIntegerDigits: 1.9,
    type: 'ordinal',
  })
  captured = {
    category: value.select('0x20000000000001'),
    resolved: value.resolvedOptions(),
  }
} finally {
  delete (Object.prototype as any).get
  delete (Object.prototype as any).toJSON
  JSON.parse = saved.parse
  JSON.stringify = saved.stringify
  Object.create = saved.create
  Object.defineProperty = saved.define
  Reflect.apply = saved.apply
  WeakMap.prototype.get = saved.get
  WeakMap.prototype.set = saved.set
  Intl.getCanonicalLocales = saved.canonical
  Math.floor = saved.floor
}
equal(captured.category, 'few', 'captured intrinsics')
equal(captured.resolved.minimumIntegerDigits, 1, 'captured floor')
root.print(
  JSON.stringify({
    type: 'PluralRules-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
