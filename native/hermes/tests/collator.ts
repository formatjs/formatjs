import {
  Collator as TypeScriptCollator,
  type CollatorOptions,
} from '@formatjs/intl-collator'
const Native = Intl.Collator as any
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
const sign = (value: number) => (value < 0 ? -1 : value > 0 ? 1 : 0)
check(
  typeof Native === 'function' && Native.polyfilled,
  'Rust Collator installed'
)
const pairs = [
  ['', ''],
  ['a', 'b'],
  ['a', 'A'],
  ['resume', 'résumé'],
  ['é', 'e\u0301'],
  ['item2', 'item10'],
  ['x', 'x1'],
  ['x1', 'x2'],
  ['item0002', 'item2'],
  ['a—b', 'ab'],
  ['l·', 'lz'],
  ['cz', 'ch'],
  ['z', 'å'],
  ['å', 'ä'],
  ['ä', 'ö'],
  ['æ', 'ø'],
  ['ø', 'å'],
  ['AE', 'Ä'],
  ['ss', 'ß'],
  ['ā', 'á'],
  ['ǎ', 'à'],
  ['à', 'a'],
  ['中文', '汉字'],
  ['あ', 'ア'],
  ['😀', '😃'],
  ['\ud800', '\udc00'],
  ['\ud800', '\ufffd'],
  ['Å', 'A\u030a'],
  ['å', 'Å'],
  ['å', 'A\u030a'],
] as const
const requests: {locale: string; options: CollatorOptions}[] = []
for (const locale of [
  'en',
  'de',
  'fr',
  'sv',
  'da',
  'es',
  'zh',
  'ja',
  'th',
  'lv',
  'cs',
  'ru',
  'ar',
  'ko',
  'hi',
  'uk',
])
  for (const sensitivity of ['base', 'accent', 'case', 'variant'] as const)
    for (const usage of ['sort', 'search'] as const)
      requests.push({
        locale,
        options: {localeMatcher: 'lookup', sensitivity, usage},
      })
for (const sensitivity of ['base', 'accent', 'case', 'variant'] as const)
  for (const numeric of [false, true])
    for (const caseFirst of ['false', 'upper', 'lower'] as const)
      for (const ignorePunctuation of [false, true])
        for (const usage of ['sort', 'search'] as const)
          requests.push({
            locale: 'en',
            options: {
              localeMatcher: 'lookup',
              sensitivity,
              numeric,
              caseFirst,
              ignorePunctuation,
              usage,
            },
          })
for (const {locale, options} of requests) {
  const model = new Native(locale, options)
  const reference = new TypeScriptCollator(locale, options)
  equal(
    model.resolvedOptions(),
    reference.resolvedOptions(),
    'TS resolved options'
  )
  check(model.compare === model.compare, 'cached bound compare')
  for (const [left, right] of pairs) {
    const expected = sign(reference.compare(left, right))
    equal(
      model.compare(left, right),
      expected,
      'TS compare ' + stringify({locale, options, left, right})
    )
    equal(model.compare(right, left), -expected || 0, 'antisymmetry')
    cases++
  }
}
const model = Native('en', {numeric: true})
check(model instanceof Native, 'callable constructor')
check(model !== Native.call(model, 'en'), 'call always allocates fresh')
check(model.constructor === Native, 'prototype constructor')
class Derived extends Native {}
check(new Derived() instanceof Derived, 'subclass prototype')
let reads = 0
const target = new Proxy(function Target() {}, {
  get(target, key, receiver) {
    if (key === 'prototype') reads++
    return Reflect.get(target, key, receiver)
  },
})
Reflect.construct(Native, [], target)
equal(reads, 1, 'one newTarget.prototype Get')
const primitiveTarget = new Proxy(function Target() {}, {
  get(target, key, receiver) {
    return key === 'prototype' ? 1 : Reflect.get(target, key, receiver)
  },
})
check(
  Object.getPrototypeOf(Reflect.construct(Native, [], primitiveTarget)) ===
    Native.prototype,
  'primitive prototype fallback'
)
const compare = model.compare
equal(compare.call({}, 'item2', 'item10'), -1, 'bound compare ignores receiver')
equal(compare(undefined, undefined), 0, 'undefined ToString')
equal(compare.length, 2, 'bound compare length')
equal(compare.name, '', 'bound compare name')
throws(
  () => Reflect.construct(compare, ['a', 'b']),
  TypeError,
  'compare not constructor'
)
const getter = Object.getOwnPropertyDescriptor(Native.prototype, 'compare')!
check(
  getter.set === undefined && getter.configurable && !getter.enumerable,
  'compare accessor descriptor'
)
equal(getter.get!.name, 'get compare', 'compare getter name')
equal(getter.get!.length, 0, 'compare getter length')
throws(
  () => Reflect.construct(getter.get!, []),
  TypeError,
  'getter not constructor'
)
for (const receiver of [{}, Object.create(Native.prototype), null, 1]) {
  throws(
    () => Reflect.apply(getter.get!, receiver, []),
    TypeError,
    'compare private brand'
  )
  throws(
    () => Native.prototype.resolvedOptions.call(receiver),
    TypeError,
    'resolved private brand'
  )
}
throws(
  () => Reflect.construct(Native.supportedLocalesOf, []),
  TypeError,
  'supported method not constructor'
)
throws(
  () => Reflect.construct(Native.prototype.resolvedOptions, []),
  TypeError,
  'resolved method not constructor'
)
equal(Native.length, 0, 'constructor length')
equal(Native.name, 'Collator', 'constructor name')
equal(Native.supportedLocalesOf.length, 1, 'supported length')
check(
  Object.getOwnPropertyDescriptor(Native, 'prototype')!.writable === false,
  'nonwritable prototype'
)
equal(Object.prototype.toString.call(model), '[object Intl.Collator]', 'tag')
equal(
  Object.keys(model.resolvedOptions()),
  [
    'locale',
    'usage',
    'sensitivity',
    'ignorePunctuation',
    'collation',
    'numeric',
    'caseFirst',
  ],
  'resolved order'
)
check(model.resolvedOptions() !== model.resolvedOptions(), 'fresh options')
const order: string[] = []
new Native(
  {
    length: 1,
    get 0() {
      order.push('locale')
      return 'en'
    },
  },
  {
    get usage() {
      order.push('usage')
      return 'sort'
    },
    get localeMatcher() {
      order.push('localeMatcher')
      return 'lookup'
    },
    get collation() {
      order.push('collation')
      return 'default'
    },
    get numeric() {
      order.push('numeric')
      return false
    },
    get caseFirst() {
      order.push('caseFirst')
      return 'false'
    },
    get sensitivity() {
      order.push('sensitivity')
      return 'variant'
    },
    get ignorePunctuation() {
      order.push('ignorePunctuation')
      return false
    },
  }
)
equal(
  order,
  [
    'locale',
    'usage',
    'localeMatcher',
    'collation',
    'numeric',
    'caseFirst',
    'sensitivity',
    'ignorePunctuation',
  ],
  'option getter order'
)
for (const collation of [
  'en_US',
  'phonebook',
  'abc\n',
  'abc\r',
  'abc\u2028',
  'abc\u2029',
])
  throws(
    () =>
      new Native('en', {
        collation,
        get numeric() {
          throw new Error('numeric read before collation validation')
        },
      }),
    RangeError,
    'invalid co early'
  )
throws(() => new Native('en', null), TypeError, 'null options')
for (const primitive of [false, 1, 'x'])
  check(
    new Native('en', primitive) instanceof Native,
    'CoerceOptionsToObject primitives'
  )
throws(
  () =>
    new Native('en_US', {
      get usage() {
        throw new Error('usage before canonicalization')
      },
    }),
  RangeError,
  'canonicalize before options'
)
const coercions: string[] = []
equal(
  compare(
    {
      [Symbol.toPrimitive](hint: string) {
        coercions.push('x:' + hint)
        return 'a'
      },
    },
    {
      [Symbol.toPrimitive](hint: string) {
        coercions.push('y:' + hint)
        return 'b'
      },
    }
  ),
  -1,
  'ToString result'
)
equal(coercions, ['x:string', 'y:string'], 'ToString order')
throws(
  () =>
    compare(Symbol('x'), {
      toString() {
        throw new Error('y before x conversion')
      },
    }),
  TypeError,
  'Symbol before y'
)
check(
  new Native('en', {
    numeric: {
      valueOf() {
        throw new Error('ToBoolean must not coerce')
      },
    },
  }).resolvedOptions().numeric === true,
  'boolean objects stay truthy'
)
equal(
  Native.supportedLocalesOf(['zz-ZZ', 'en-US-u-kn']),
  ['en-US-u-kn'],
  'supported tags preserved'
)
for (const collation of ['default', 'standard', 'search'])
  equal(
    new Native('en-u-co-' + collation).resolvedOptions().locale,
    'en',
    'unsupported/default co removed'
  )
const search = new Native('de-u-co-phonebk', {
  usage: 'search',
  collation: 'phonebk',
})
equal(search.resolvedOptions().locale, 'de', 'search omits sort keyword')
equal(search.compare('AE', 'Ä'), -1, 'German search tailoring')
equal(
  new Native('tr', {sensitivity: 'base'}).compare('I', 'ı'),
  0,
  'Turkish ICU casing'
)
check(
  compare('\ud800', '\ufffd') !== 0,
  'lone surrogate differs from replacement'
)
for (const sensitivity of ['base', 'accent'])
  for (const caseFirst of ['upper', 'lower'])
    equal(
      new Native('en', {sensitivity, caseFirst}).compare('a', 'A'),
      0,
      'caseFirst cannot override insensitive mode'
    )
const upper = new Native('en', {caseFirst: 'upper'})
check(
  Object.is(upper.compare('Å', 'A\u030a'), 0),
  'canonical equivalents positive zero'
)
equal(
  sign(upper.compare('å', 'Å')),
  sign(upper.compare('å', 'A\u030a')),
  'canonical tie-break consistency'
)
const originalParse = JSON.parse,
  originalStringify = JSON.stringify
const originalApply = Reflect.apply
const originalGet = WeakMap.prototype.get,
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
  const isolated = new Native('en', {numeric: true})
  equal(
    isolated.compare('item2', 'item10'),
    -1,
    'captured construction/comparison intrinsics'
  )
  equal(
    isolated.resolvedOptions().numeric,
    true,
    'captured resolved-options intrinsics'
  )
  equal(Native.supportedLocalesOf(['en']), ['en'], 'captured locale intrinsics')
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
;(globalThis as any).print(
  stringify({
    type: 'Collator-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    cases,
    assertions,
  })
)
