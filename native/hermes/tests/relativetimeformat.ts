import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-numberformat/polyfill-force.js'
import type {NumberFormat} from '@formatjs/intl-numberformat'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import Reference from '@formatjs/intl-relativetimeformat'

const Native = Intl.RelativeTimeFormat as any
const fixtures = (globalThis as any).__RELATIVE_FIXTURES as {
  packs: string[]
  plurals: any[]
}
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
  'Rust RelativeTimeFormat installed'
)
equal(Native.supportedLocalesOf(['en', 'fr']), [], 'no implicit locale data')
for (const data of fixtures.plurals)
  (Intl.PluralRules as unknown as typeof PluralRules).__addLocaleData(data)
for (const text of fixtures.packs) {
  const pack = JSON.parse(text)
  Native.__addLocaleData(text)
  Reference.__addLocaleData(pack)
  ;(Intl.NumberFormat as unknown as typeof NumberFormat).__addLocaleData(
    pack.number
  )
}
const units = [
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
] as const
const values = [0, -0, 1, -1, 2, -2, 3, -3, 1.25, -1.25, 1234.5678, 1e-7, 1e21]
function compare(
  locale: string | string[],
  options: Intl.RelativeTimeFormatOptions & {numberingSystem?: string},
  inputs: readonly any[] = values
): void {
  const model = new Native(locale, options),
    reference = new Reference(locale, options)
  const description = JSON.stringify({locale, options})
  equal(
    model.resolvedOptions(),
    reference.resolvedOptions(),
    'TS resolved ' + description
  )
  equal(
    Object.keys(model.resolvedOptions()),
    Object.keys(reference.resolvedOptions()),
    'resolved property order'
  )
  for (const value of inputs)
    for (const unit of [...units, ...units.map(unit => unit + 's')]) {
      equal(
        model.format(value, unit),
        reference.format(value, unit as Intl.RelativeTimeFormatUnit),
        'TS format ' + description + ' ' + String(value) + ' ' + unit
      )
      const parts = model.formatToParts(value, unit)
      equal(
        parts,
        reference.formatToParts(value, unit as Intl.RelativeTimeFormatUnit),
        'TS parts ' + description + ' ' + String(value) + ' ' + unit
      )
      equal(
        parts.map((part: any) => Object.keys(part)),
        reference
          .formatToParts(value, unit as Intl.RelativeTimeFormatUnit)
          .map(part => Object.keys(part)),
        'parts property order'
      )
      cases++
    }
}
for (const locale of [
  'en',
  'fr',
  'ar',
  'pl',
  'ru',
  'cy',
  'sl',
  'lv',
  'ja',
  'zh',
  'bn',
  'hi',
  'sr-Latn',
  'gsw',
  'my',
  'ne',
])
  for (const style of ['long', 'short', 'narrow'] as const)
    for (const numeric of ['always', 'auto'] as const)
      compare(locale, {style, numeric})
const english = JSON.parse(fixtures.packs[0])
for (const numberingSystem of english.data.nu)
  compare('en', {numberingSystem}, [-0, 1.25, -2.5, 1234.5678])
for (const locale of [
  'en-u-nu-arab',
  'fr-u-nu-latn',
  'sr-Latn-u-nu-thai',
  ['zz', 'fr-u-nu-arab'],
])
  for (const numberingSystem of [undefined, 'latn', 'arab', 'foobar'])
    compare(locale, {numberingSystem}, [0, -1, 1234.5678])
compare('en', {}, ['-0', ' 0x10 ', null, true])
const model = new Native('en')
for (const method of ['format', 'formatToParts']) {
  for (const value of [NaN, Infinity, -Infinity])
    throws(() => model[method](value, 'day'), RangeError, 'nonfinite ' + method)
  for (const unit of ['', 'Day', 'dayss', '\ud800', '\udc00', 'day\0'])
    throws(() => model[method](1, unit), RangeError, 'invalid unit ' + method)
  throws(() => model[method](1n, 'day'), TypeError, 'BigInt ToNumber')
  throws(() => model[method](Symbol(), 'day'), TypeError, 'Symbol ToNumber')
  throws(() => model[method](1, Symbol()), TypeError, 'Symbol ToString')
  let order: string[] = []
  const value = {
    [Symbol.toPrimitive](hint: string) {
      order.push(hint)
      return -1
    },
  }
  const unit = {
    [Symbol.toPrimitive](hint: string) {
      order.push(hint)
      return 'day'
    },
  }
  equal(model[method](value, unit), model[method](-1, 'day'), 'coerced result')
  equal(order, ['number', 'string'], 'value before unit with correct hints')
  order = []
  throws(
    () => Native.prototype[method].call({}, value, unit),
    TypeError,
    'brand first'
  )
  equal(order, [], 'bad brand skips hooks')
  const sentinel = new Error('unit hook')
  let caught: unknown
  try {
    model[method](Infinity, {
      toString() {
        throw sentinel
      },
    })
  } catch (error) {
    caught = error
  }
  check(caught === sentinel, 'unit hook precedes finite validation')
  equal(Native.prototype[method].length, 2, 'method length')
  equal(Native.prototype[method].name, method, 'method name')
  throws(
    () => new Native.prototype[method](1, 'day'),
    TypeError,
    'method not constructor'
  )
}
throws(() => Native('en'), TypeError, 'requires new')
throws(() => new Native('en', null), TypeError, 'null options')
for (const options of [
  {style: 'bad'},
  {numeric: 'bad'},
  {localeMatcher: 'bad'},
  {numberingSystem: 'a'},
])
  throws(() => new Native('en', options), RangeError, 'invalid option')
for (const numberingSystem of [
  'latn","style":"narrow',
  'latn\\arab',
  'latn\narab',
  'latn\0arab',
  'latn\ud800',
]) {
  let styleReads = 0
  throws(
    () =>
      new Native('en', {
        numberingSystem,
        get style() {
          styleReads++
          return 'narrow'
        },
      }),
    RangeError,
    'invalid numbering system before later options'
  )
  equal(styleReads, 0, 'invalid numbering system skips style getter')
}
for (const receiver of [undefined, null, {}, Native.prototype])
  throws(
    () => Native.prototype.resolvedOptions.call(receiver),
    TypeError,
    'resolved brand'
  )
equal(Native.length, 0, 'constructor length')
equal(Native.name, 'RelativeTimeFormat', 'constructor name')
equal(
  Object.prototype.toString.call(model),
  '[object Intl.RelativeTimeFormat]',
  'tag'
)
const trace: string[] = []
new Native(
  'en',
  Object.defineProperties(
    {},
    Object.fromEntries(
      ['localeMatcher', 'numberingSystem', 'style', 'numeric'].map(key => [
        key,
        {
          get() {
            trace.push(key)
            return undefined
          },
        },
      ])
    )
  )
)
equal(
  trace,
  ['localeMatcher', 'numberingSystem', 'style', 'numeric'],
  'constructor getters'
)
let prototypeReads = 0
const subclassPrototype = {}
const target = new Proxy(function () {}, {
  get(target, key, receiver) {
    if (key === 'prototype') {
      prototypeReads++
      return subclassPrototype
    }
    return Reflect.get(target, key, receiver)
  },
})
const derived = Reflect.construct(Native, ['en'], target)
check(
  Object.getPrototypeOf(derived) === subclassPrototype,
  'new.target prototype'
)
equal(prototypeReads, 1, 'prototype read once')
class Derived extends Native {}
Object.defineProperty(Derived.prototype, 'constructor', {
  get() {
    throw new Error('constructor getter must not run')
  },
})
equal(
  new (Derived as any)('en').format(1, 'day'),
  'in 1 day',
  'subclass skips constructor getter'
)

const parts = model.formatToParts(1.25, 'day')
parts[0].value = 'mutated'
check(model.formatToParts(1.25, 'day')[0].value !== 'mutated', 'fresh parts')
const resolved = model.resolvedOptions()
resolved.locale = 'mutated'
equal(model.resolvedOptions().locale, 'en', 'fresh options')
const available = Native.availableLocales
available.clear()
check(Native.availableLocales.has('en'), 'fresh available locales')
const savedGet = WeakMap.prototype.get,
  savedSet = WeakMap.prototype.set,
  savedBind = Function.prototype.bind,
  savedCanonical = Intl.getCanonicalLocales
function poisonedIntrinsic(): never {
  throw new Error('replacement intrinsic called')
}
WeakMap.prototype.get = WeakMap.prototype.set = poisonedIntrinsic
Function.prototype.bind = poisonedIntrinsic
Intl.getCanonicalLocales = poisonedIntrinsic
try {
  const captured = new Native('en')
  equal(
    captured.format(-3, 'day'),
    '3 days ago',
    'captured constructor intrinsics'
  )
  equal(model.format(-1, 'day'), '1 day ago', 'captured existing slots')
  equal(Native.supportedLocalesOf(['en']), ['en'], 'captured canonicalizer')
  throws(
    () => Native.prototype.format.call({}, 1, 'day'),
    TypeError,
    'captured slot brand'
  )
} finally {
  WeakMap.prototype.get = savedGet
  WeakMap.prototype.set = savedSet
  Function.prototype.bind = savedBind
  Intl.getCanonicalLocales = savedCanonical
}
// Relative fields follow style/numeric getters; existing instances retain their data.
const old = new Native('en'),
  replacement = JSON.parse(fixtures.packs[0])
replacement.data.day.future.other = 'AFTER {0}'
replacement.data.day.future.one = 'AFTER {0}'
const changed = new Native('en', {
  get style() {
    Native.__addLocaleData(JSON.stringify(replacement))
    return 'long'
  },
})
equal(
  changed.format(1, 'day'),
  'AFTER 1',
  'getter replacement supplies new fields'
)
equal(old.format(1, 'day'), 'in 1 day', 'old instance retains fields')
Native.__addLocaleData(fixtures.packs[0])
// Native data embeds number/plural records; globals are only needed by TS reference.
const numberDescriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
const pluralDescriptor = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!
try {
  delete (Intl as any).NumberFormat
  delete (Intl as any).PluralRules
  equal(
    new Native('fr').format(2, 'day'),
    'dans 2 jours',
    'independent number/plural data'
  )
} finally {
  Object.defineProperty(Intl, 'NumberFormat', numberDescriptor)
  Object.defineProperty(Intl, 'PluralRules', pluralDescriptor)
}
print(
  JSON.stringify({
    type: 'RelativeTimeFormat-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)

declare function print(value: string): void
