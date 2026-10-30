import {
  DisplayNames as TypeScriptDisplayNames,
  type DisplayNamesOptions,
} from '@formatjs/intl-displaynames'

const root = globalThis as any
const Native = Intl.DisplayNames as any
const fixtures = root.__DISPLAY_FIXTURES as {packs: string[]; tsData: any[]}
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
function throws(callback: () => unknown, kind: any, message: string): void {
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
  'Rust DisplayNames installed'
)
equal(Native.supportedLocalesOf(['en', 'fr']), [], 'no implicit locale data')
throws(
  () => new Native(),
  TypeError,
  'required options before empty-registry matching'
)
Native.__addLocaleData(fixtures.packs[0])
TypeScriptDisplayNames.__addLocaleData(fixtures.tsData[0])
const existing = new Native('en', {type: 'language'})
equal(existing.of('en'), 'English', 'initial English pack')
equal(Native.supportedLocalesOf('fr'), [], 'French stays unloaded')
for (let index = 1; index < fixtures.packs.length; index++) {
  Native.__addLocaleData(fixtures.packs[index])
  TypeScriptDisplayNames.__addLocaleData(fixtures.tsData[index])
}
equal(
  new Native('fr', {type: 'language'}).of('en'),
  'anglais',
  'late French pack'
)
const replacement = JSON.parse(fixtures.packs[0])
replacement.data.types.language.dialect.long.en = 'changed'
Native.__addLocaleData(stringify(replacement))
equal(
  new Native('en', {type: 'language'}).of('en'),
  'changed',
  'replacement affects new instance'
)
equal(existing.of('en'), 'English', 'old instance retains data')
Native.__addLocaleData(fixtures.packs[0])

const codes = {
  language: [
    'en',
    'EN-gb',
    'zh-Hans-SG',
    'zh-Hant-HK',
    'xx-XY',
    'zh-Hans-XY',
    'iw',
    'sh',
    'de-1901',
    'und',
    'zzzzz',
    'root',
    'en-u-ca-gregory',
    'en\n',
  ],
  region: [
    'US',
    'us',
    'GB',
    'CN',
    'SG',
    'XY',
    '419',
    '001',
    'BU',
    'US\n',
    'U1',
  ],
  script: [
    'Latn',
    'latn',
    'CYRL',
    'Arab',
    'Hans',
    'Hant',
    'Zzzz',
    'zzzz',
    'Latn\n',
    'abc',
  ],
  currency: ['usd', 'EUR', 'JPY', 'XYZ', 'zzz', 'XXX', 'XTS', 'USD\n', 'US'],
  calendar: [
    'gregory',
    'GREGORY',
    'buddhist',
    'japanese',
    'ethiopic',
    'ethioaa',
    'islamic-civil',
    'islamicc',
    'abc_def',
    'gregory\n',
  ],
  dateTimeField: [
    'era',
    'year',
    'quarter',
    'month',
    'weekOfYear',
    'weekday',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'timeZoneName',
    'YEAR',
    'year\n',
  ],
}
function outcome(callback: () => unknown): object {
  try {
    return {value: callback() ?? null}
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    return {error: 'RangeError'}
  }
}
for (let index = 0; index < fixtures.packs.length; index++) {
  const locale = JSON.parse(fixtures.packs[index]).locale as string
  for (const type of Object.keys(codes) as (keyof typeof codes)[]) {
    for (const style of ['long', 'short', 'narrow'] as const)
      for (const fallback of ['code', 'none'] as const) {
        for (const languageDisplay of type === 'language'
          ? (['dialect', 'standard'] as const)
          : (['standard'] as const)) {
          const options: DisplayNamesOptions = {
            type,
            style,
            fallback,
            languageDisplay,
          }
          const candidate = new Native(locale, options)
          const reference = new TypeScriptDisplayNames(locale, options)
          equal(
            candidate.resolvedOptions(),
            reference.resolvedOptions(),
            locale + '/options'
          )
          for (const code of codes[type]) {
            equal(
              outcome(() => candidate.of(code)),
              outcome(() => reference.of(code)),
              locale + '/' + type + '/' + code
            )
            cases++
          }
        }
      }
  }
}
const region = new Native('en', {type: 'region'})
equal(region.of(123), region.of('123'), 'number code uses ToString')
equal(region.of(123n), region.of('123'), 'BigInt code uses ToString')
for (const type of Object.keys(codes)) {
  const formatter = new Native('en', {type})
  throws(() => formatter.of('\ud800'), RangeError, 'lone high surrogate')
  throws(() => formatter.of('\udc00'), RangeError, 'lone low surrogate')
  throws(() => formatter.of(Symbol()), TypeError, 'Symbol ToString')
}
const hints: string[] = []
equal(
  region.of({
    [Symbol.toPrimitive](hint: string) {
      hints.push(hint)
      return 'US'
    },
  }),
  region.of('US'),
  'exotic ToPrimitive'
)
equal(hints, ['string'], 'string hint')
let valueOfRead = false
equal(
  region.of({
    toString() {
      return 'US'
    },
    get valueOf() {
      valueOfRead = true
      throw new Error('valueOf')
    },
  }),
  region.of('US'),
  'ordinary string hint'
)
check(!valueOfRead, 'toString before valueOf')
equal(
  region.of({
    [Symbol.toPrimitive]: null,
    toString() {
      return 'US'
    },
  }),
  region.of('US'),
  'null exotic falls back'
)
throws(
  () =>
    region.of({
      [Symbol.toPrimitive]() {
        return {}
      },
    }),
  TypeError,
  'nonprimitive exotic result'
)
const operations: string[] = []
const code = new Proxy(
  {
    toString() {
      return 'US'
    },
  },
  {
    get(target, key, receiver) {
      operations.push('get:' + String(key))
      return Reflect.get(target, key, receiver)
    },
    has() {
      throw new Error('unexpected HasProperty')
    },
  }
)
region.of(code)
equal(
  operations,
  ['get:Symbol(Symbol.toPrimitive)', 'get:toString'],
  'Get without HasProperty'
)

for (const method of ['of', 'resolvedOptions']) {
  const fn = Native.prototype[method]
  equal(fn.name, method, 'method name')
  equal(fn.length, method === 'of' ? 1 : 0, 'method arity')
  throws(() => new fn(), TypeError, 'nonconstructable method')
  for (const receiver of [
    null,
    {},
    Native.prototype,
    Object.create(Native.prototype),
    new Proxy(region, {}),
  ]) {
    throws(() => fn.call(receiver, 'US'), TypeError, 'private receiver brand')
  }
}
let coerced = false
throws(
  () =>
    Native.prototype.of.call(
      {},
      {
        toString() {
          coerced = true
          return 'US'
        },
      }
    ),
  TypeError,
  'brand before coercion'
)
check(!coerced, 'bad receiver does not coerce code')
equal(Native.length, 2, 'constructor arity')
equal(Native.supportedLocalesOf.length, 1, 'supportedLocalesOf arity')
equal(
  Object.keys(existing.resolvedOptions()),
  ['locale', 'style', 'type', 'fallback', 'languageDisplay'],
  'language option order'
)
equal(
  Object.keys(region.resolvedOptions()),
  ['locale', 'style', 'type', 'fallback'],
  'non-language option order'
)
check(
  !Object.prototype.hasOwnProperty.call(
    region.resolvedOptions(),
    'languageDisplay'
  ),
  'absent languageDisplay for region'
)
equal(
  Object.prototype.toString.call(region),
  '[object Intl.DisplayNames]',
  'toStringTag'
)
throws(() => Native('en', {type: 'region'}), TypeError, 'requires new')
class Derived extends Native {
  constructor(...args: any[]) {
    super(...args)
  }
}
check(
  new Derived('en', {type: 'region'}) instanceof Derived,
  'subclass receiver'
)
const customPrototype = {}
function Target() {}
Target.prototype = customPrototype
let prototypeReads = 0
const target = new Proxy(Target, {
  get(target, key, receiver) {
    if (key === 'prototype') prototypeReads++
    return Reflect.get(target, key, receiver)
  },
})
const custom = Reflect.construct(Native, ['en', {type: 'region'}], target)
check(Object.getPrototypeOf(custom) === customPrototype, 'newTarget prototype')
equal(prototypeReads, 1, 'one prototype Get')
equal(
  Native.prototype.of.call(custom, 'US'),
  region.of('US'),
  'custom receiver branded'
)
const order: string[] = []
new Native('en', {
  get localeMatcher() {
    order.push('matcher')
    return 'lookup'
  },
  get style() {
    order.push('style')
    return {
      toString() {
        order.push('style string')
        return 'short'
      },
    }
  },
  get type() {
    order.push('type')
    return 'region'
  },
  get fallback() {
    order.push('fallback')
    return 'code'
  },
  get languageDisplay() {
    order.push('languageDisplay')
    return 'standard'
  },
})
equal(
  order,
  ['matcher', 'style', 'style string', 'type', 'fallback', 'languageDisplay'],
  'option access and coercion order'
)
let typeRead = false,
  fallbackRead = false,
  optionsRead = false
throws(
  () =>
    new Native('en', {
      style: 'invalid',
      get type() {
        typeRead = true
        return 'region'
      },
    }),
  RangeError,
  'invalid style'
)
check(!typeRead, 'style error before type Get')
throws(
  () =>
    new Native('en', {
      get fallback() {
        fallbackRead = true
        return 'code'
      },
    }),
  TypeError,
  'required type'
)
check(!fallbackRead, 'missing type before fallback Get')
throws(
  () =>
    new Native('en--US', {
      get localeMatcher() {
        optionsRead = true
        return 'lookup'
      },
    }),
  RangeError,
  'invalid locale'
)
check(!optionsRead, 'locale error before options access')
for (const options of [undefined, null])
  throws(() => new Native('en', options), TypeError, 'required options')
throws(
  () => new Native('en', {type: 'region', languageDisplay: 'invalid'}),
  RangeError,
  'validate unused languageDisplay'
)
equal(
  Native.supportedLocalesOf(['fr-FR-u-nu-latn']),
  ['fr-FR-u-nu-latn'],
  'supported tags preserve extension'
)
const localeObject = new Intl.Locale('fr')
let localeToStringCalled = false
localeObject.toString = () => {
  localeToStringCalled = true
  throw new Error('Locale intrinsic required')
}
equal(
  new Native(localeObject, {type: 'region'}).resolvedOptions().locale,
  'fr',
  'constructor Locale brand'
)
throws(() => region.of(localeObject), Error, 'of uses ordinary code ToString')
check(localeToStringCalled, 'of invokes overridden Locale toString')
const first = existing.resolvedOptions()
first.languageDisplay = 'standard'
equal(
  existing.resolvedOptions().languageDisplay,
  'dialect',
  'fresh resolved options'
)
const available = Native.supportedLocalesOf(['en', 'fr'])
throws(
  () => Native.__addLocaleData('{"formatVersion":1,"locale":"fr"}'),
  RangeError,
  'failed pack load'
)
equal(
  Native.supportedLocalesOf(['en', 'fr']),
  available,
  'failed registration atomic'
)
equal(existing.of('en'), 'English', 'failed load preserves instance')

const originalParse = JSON.parse,
  originalStringify = JSON.stringify
const originalApply = Reflect.apply,
  originalGet = WeakMap.prototype.get,
  originalSet = WeakMap.prototype.set
const originalCharCodeAt = String.prototype.charCodeAt
const originalCreate = Object.create,
  originalDefine = Object.defineProperty
const originalCanonicalize = Intl.getCanonicalLocales
function poisoned(): never {
  throw new Error('tampered intrinsic called')
}
try {
  JSON.parse = poisoned
  JSON.stringify = poisoned
  Reflect.apply = poisoned
  WeakMap.prototype.get = poisoned
  WeakMap.prototype.set = poisoned
  String.prototype.charCodeAt = poisoned
  Object.create = poisoned
  Object.defineProperty = poisoned
  Intl.getCanonicalLocales = poisoned
  equal(
    new Native('en', {type: 'language'}).of('en'),
    'English',
    'captured constructor/query intrinsics'
  )
  throws(
    () => region.of('\ud800'),
    RangeError,
    'captured UTF-16 query intrinsic'
  )
} finally {
  JSON.parse = originalParse
  JSON.stringify = originalStringify
  Reflect.apply = originalApply
  WeakMap.prototype.get = originalGet
  WeakMap.prototype.set = originalSet
  String.prototype.charCodeAt = originalCharCodeAt
  Object.create = originalCreate
  Object.defineProperty = originalDefine
  Intl.getCanonicalLocales = originalCanonicalize
}
root.print(
  stringify({
    type: 'DisplayNames-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
