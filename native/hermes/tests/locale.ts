import {Locale as TypeScriptLocale} from '@formatjs/intl-locale'
import {likelySubtags} from '@formatjs_generated/cldr.core/likelySubtags.js'

const root = globalThis as any
const NativeLocale = Intl.Locale as any
let assertions = 0,
  cases = 0
function check(condition: unknown, message: string) {
  assertions++
  if (!condition) throw new Error(message)
}
function equal(actual: unknown, expected: unknown, message: string) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    message + ': ' + JSON.stringify({actual, expected})
  )
}
function throws(callback: () => unknown, error: any, message: string) {
  let caught: unknown
  try {
    callback()
  } catch (value) {
    caught = value
  }
  check(caught instanceof error, message)
}
function snapshot(value: any): Record<string, unknown> {
  return {
    locale: value.toString(),
    baseName: value.baseName,
    language: value.language,
    script: value.script,
    region: value.region,
    variants: value.variants,
    calendar: value.calendar,
    collation: value.collation,
    hourCycle: value.hourCycle,
    caseFirst: value.caseFirst,
    numeric: value.numeric,
    numberingSystem: value.numberingSystem,
    firstDayOfWeek: value.firstDayOfWeek,
    maximized: value.maximize().toString(),
    minimized: value.minimize().toString(),
    calendars: value.getCalendars(),
    collations: value.getCollations(),
    hourCycles: value.getHourCycles(),
    numberingSystems: value.getNumberingSystems(),
    timeZones: value.getTimeZones(),
    textInfo: value.getTextInfo(),
    weekInfo: value.getWeekInfo(),
  }
}
function compare(tag: string, options?: any) {
  cases++
  let expected: any, failure: any
  try {
    expected = snapshot(new TypeScriptLocale(tag, options))
  } catch (error) {
    failure = error
  }
  if (failure) {
    throws(
      () => new NativeLocale(tag, options),
      failure.constructor,
      tag + ' error'
    )
    return
  }
  const actual = snapshot(new NativeLocale(tag, options))
  for (const key of Object.keys(expected))
    equal(actual[key], expected[key], tag + ' ' + key)
}
for (const tag of [
  'en',
  'en-US',
  'en-GB',
  'ar',
  'ar-EG',
  'fa',
  'he',
  'iw-BU',
  'ja',
  'th',
  'zh-Hant',
  'zh-Hani',
  'und',
  'und-Thai',
  'und-419',
  'und-CW',
  'und-150',
  'und-AQ',
  'und-Zzzz',
  'aae-Latn-IT',
  'abcde',
  'abcde-Arab',
  'en-Arab',
  'ar-Latn',
  'en-US-u-rg-gbzzzz',
  'en-u-sd-gbeng',
  'en-US-u-rg-qqzzzz',
  'hye-Latn-SU',
]) {
  for (const suffix of [
    '',
    '-fonipa',
    '-a-extend-u-co-phonebk-x-private',
    '-u-ca-gregory',
  ])
    compare(tag + suffix)
}
for (const tag of Object.keys(likelySubtags)
  .sort()
  .filter((_, index) => index % 53 === 0)
  .slice(0, 180))
  compare(tag)
for (const options of [
  {language: 'hye'},
  {language: 'abcde'},
  {script: 'Arab'},
  {region: '419'},
  {variants: '1996-FONIPA'},
  {calendar: 'islamicc'},
  {collation: 'foobar'},
  {hourCycle: 'h24'},
  {caseFirst: 'upper'},
  {numeric: true},
  {numeric: false},
  {numberingSystem: 'ARAB'},
  {firstDayOfWeek: '0'},
  {firstDayOfWeek: '7'},
  {firstDayOfWeek: 'MON'},
  {firstDayOfWeek: 'xyz'},
]) {
  for (const tag of [
    'en',
    'ar-EG-u-ca-buddhist-kn-false-x-private',
    'hye-Latn-SU',
  ])
    compare(tag, options)
}
for (const tag of ['', 'root', 'en_US', 'abcd', 'en-1901-1901', 'x-private'])
  compare(tag)
for (const options of [
  {language: 'abcd'},
  {script: 'lat'},
  {region: '1234'},
  {variants: ''},
  {variants: 'FONIPA-fonipa'},
  {calendar: 'ab'},
  {hourCycle: 'H12'},
  {caseFirst: 'Upper'},
  {firstDayOfWeek: '08'},
  {numberingSystem: 'foo_bar'},
])
  compare('en', options)

check(NativeLocale !== TypeScriptLocale, 'Candidate is Rust binding')
equal(NativeLocale.name, 'Locale', 'constructor name')
equal(NativeLocale.length, 1, 'constructor length')
equal(
  Object.getOwnPropertyDescriptor(NativeLocale, 'prototype')!.writable,
  false,
  'prototype descriptor'
)
equal(
  Object.prototype.toString.call(new NativeLocale('en')),
  '[object Intl.Locale]',
  'toStringTag'
)
throws(() => NativeLocale('en'), TypeError, 'new required')
for (const tag of [undefined, null, true, 1, 1n, Symbol('tag')])
  throws(() => new NativeLocale(tag), TypeError, 'primitive tag rejected')
throws(
  () => new NativeLocale('bad_tag', null),
  TypeError,
  'options coercion precedes tag validation'
)
let reads: string[] = []
const options = new Proxy(
  {},
  {
    get(_target, key) {
      reads.push(String(key))
      return undefined
    },
  }
)
new NativeLocale('en', options)
equal(
  reads,
  [
    'language',
    'script',
    'region',
    'variants',
    'calendar',
    'collation',
    'firstDayOfWeek',
    'hourCycle',
    'caseFirst',
    'numeric',
    'numberingSystem',
  ],
  'option order'
)
reads = []
throws(
  () =>
    new NativeLocale(
      'en',
      new Proxy(
        {},
        {
          get(_target, key) {
            reads.push(String(key))
            return key === 'language' ? 'abcd' : undefined
          },
        }
      )
    ),
  RangeError,
  'bad language'
)
equal(reads, ['language'], 'early validation')
reads = []
throws(() => new NativeLocale('en_US', options), RangeError, 'bad tag')
equal(reads, [], 'tag validation before getters')
let coercions = 0
const tag = {
  [Symbol.toPrimitive](hint: string) {
    equal(hint, 'string', 'string hint')
    coercions++
    return 'en'
  },
}
equal(new NativeLocale(tag).toString(), 'en', 'object tag')
equal(coercions, 1, 'tag coerced once')
const callable = Object.assign(function () {}, {
  toString() {
    return 'fr'
  },
})
equal(new NativeLocale(callable).language, 'fr', 'callable tag')
const genuine = new NativeLocale('en-US')
genuine[Symbol.toPrimitive] = () => {
  throw new Error('must bypass coercion')
}
equal(new NativeLocale(genuine).toString(), 'en-US', 'native Locale tag brand')
const old = new root.__trustedLocale('fr')
old.toString = () => {
  throw new Error('must bypass old Locale coercion')
}
equal(new NativeLocale(old).toString(), 'fr', 'trusted existing Locale brand')
equal(
  Intl.getCanonicalLocales(genuine),
  ['en-US'],
  'canonicalization recognizes Rust Locale'
)
for (const name of Object.getOwnPropertyNames(NativeLocale.prototype)) {
  if (name === 'constructor') continue
  const descriptor = Object.getOwnPropertyDescriptor(
    NativeLocale.prototype,
    name
  )!
  equal(descriptor.enumerable, false, name + ' nonenumerable')
  const method = descriptor.get || descriptor.value
  for (const receiver of [
    undefined,
    null,
    {},
    Object.create(NativeLocale.prototype),
    new Proxy(genuine, {}),
  ])
    throws(() => method.call(receiver), TypeError, name + ' receiver brand')
  throws(
    () => Reflect.construct(method, []),
    TypeError,
    name + ' not constructible'
  )
  equal(method.length, 0, name + ' length')
}
class Child extends NativeLocale {
  constructor(...args: any[]) {
    super(...args)
  }
}
const child = new Child('zh-Hant')
check(child instanceof Child, 'subclass prototype')
Object.defineProperty(child, 'constructor', {
  get() {
    throw new Error('must not read constructor')
  },
})
check(
  Object.getPrototypeOf(child.minimize()) === NativeLocale.prototype,
  'intrinsic Locale result'
)
const Alternate = function () {}
Alternate.prototype = 1 as any
const alternate = Reflect.construct(NativeLocale, ['en'], Alternate)
check(
  Object.getPrototypeOf(alternate) === NativeLocale.prototype,
  'newTarget prototype fallback'
)
let prototypeReads = 0
const customPrototype = {}
const NewTarget = new Proxy(function () {}, {
  get(target, key, receiver) {
    if (key === 'prototype') {
      prototypeReads++
      return customPrototype
    }
    return Reflect.get(target, key, receiver)
  },
})
const custom = Reflect.construct(NativeLocale, ['en'], NewTarget)
check(
  Object.getPrototypeOf(custom) === customPrototype && prototypeReads === 1,
  'single prototype lookup'
)
equal(
  NativeLocale.prototype.toString.call(custom),
  'en',
  'custom prototype branded'
)
check(
  new NativeLocale('en', {
    numeric: {
      valueOf() {
        throw new Error('no coercion')
      },
    },
  }).numeric,
  'numeric ToBoolean'
)
throws(
  () => new NativeLocale('en', {calendar: Symbol()}),
  TypeError,
  'option symbol rejected'
)
const locale = new NativeLocale('en-US')
const calendars = locale.getCalendars()
calendars.length = 0
check(locale.getCalendars().length > 0, 'fresh calendars')
const weekend = locale.getWeekInfo().weekend
weekend.length = 0
check(locale.getWeekInfo().weekend.length > 0, 'fresh weekend')
const info = new NativeLocale('abcde').getTextInfo()
check(
  Object.hasOwn(info, 'direction') && info.direction === undefined,
  'own unknown direction'
)
const NumberFormat = Intl.NumberFormat
;(Intl as any).NumberFormat = undefined
equal(locale.getNumberingSystems(), ['latn'], 'missing formatter fallback')
equal(
  new NativeLocale('en-u-nu-thai').getNumberingSystems(),
  ['thai'],
  'explicit nu bypasses formatter'
)
;(Intl as any).NumberFormat = NumberFormat
const Collator = Intl.Collator
;(Intl as any).Collator = undefined
equal(locale.getCollations(), ['emoji', 'eor'], 'missing collator fallback')
;(Intl as any).Collator = Collator

// Constructor and query transport must not invoke application serialization hooks.
const parse = JSON.parse,
  stringify = JSON.stringify
const weakGet = WeakMap.prototype.get,
  weakSet = WeakMap.prototype.set
const oldToJSON = Object.getOwnPropertyDescriptor(Object.prototype, 'toJSON')
try {
  JSON.parse = JSON.stringify = (() => {
    throw new Error('changed JSON intrinsic')
  }) as any
  WeakMap.prototype.get = WeakMap.prototype.set = (() => {
    throw new Error('changed WeakMap intrinsic')
  }) as any
  Object.defineProperty(Object.prototype, 'toJSON', {
    configurable: true,
    value() {
      throw new Error('application toJSON')
    },
  })
  const value = new NativeLocale('ar', {calendar: 'gregory'})
  check(
    value.calendar === 'gregory' && value.getTextInfo().direction === 'rtl',
    'captured intrinsics'
  )
  check(value.getWeekInfo().weekend.length > 0, 'private query ignores toJSON')
} finally {
  JSON.parse = parse
  JSON.stringify = stringify
  WeakMap.prototype.get = weakGet
  WeakMap.prototype.set = weakSet
  if (oldToJSON) Object.defineProperty(Object.prototype, 'toJSON', oldToJSON)
  else delete (Object.prototype as any).toJSON
}

// Keep one Rust record alive while the real TS formatter loads another locale.
const bengali = new NativeLocale('bn')
check(
  !NumberFormat.supportedLocalesOf(['bn']).length,
  'Bengali initially unloaded'
)
equal(bengali.getNumberingSystems(), ['latn'], 'unloaded locale fallback')
root.__finishLocaleConformance = () => {
  const expected = new NumberFormat('bn').resolvedOptions().numberingSystem
  check(expected !== 'latn', 'new locale has distinct numbering system')
  equal(
    bengali.getNumberingSystems(),
    [expected],
    'existing Rust record sees newly loaded locale'
  )
  check(cases > 250 && assertions > 1000, 'complete comparison coverage')
  root.print(
    JSON.stringify({
      type: 'Locale-conformance',
      cases,
      assertions,
      candidate: 'Rust JSI installed API',
      backend: 'TypeScript formatters',
      onDemand: true,
    })
  )
  delete root.__finishLocaleConformance
}
