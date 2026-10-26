import TypeScriptListFormat from '@formatjs/intl-listformat'

const root = globalThis as any
const Native = (Intl as any).ListFormat
const fixtures = root.__LIST_FIXTURES as {packs: string[]; tsData: any[]}
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
  'Rust ListFormat installed'
)
equal(Native.supportedLocalesOf(['en', 'fr']), [], 'no implicit locale data')
Native.__addLocaleData(fixtures.packs[0])
TypeScriptListFormat.__addLocaleData(fixtures.tsData[0])
const existing = new Native('en')
equal(existing.format(['A', 'B']), 'A and B', 'initial English pack')
equal(Native.supportedLocalesOf('fr'), [], 'French stays unloaded')
for (let index = 1; index < fixtures.packs.length; index++) {
  Native.__addLocaleData(fixtures.packs[index])
  TypeScriptListFormat.__addLocaleData(fixtures.tsData[index])
}
equal(new Native('fr').format(['A', 'B']), 'A et B', 'late French pack')
equal(
  existing.format(['A', 'B']),
  'A and B',
  'existing instance survives registration'
)
const replacement = JSON.parse(fixtures.packs[0])
replacement.data.conjunction.long.pair = '{0} & {1}'
Native.__addLocaleData(stringify(replacement))
equal(
  new Native('en').format(['A', 'B']),
  'A & B',
  'replacement affects new instance'
)
equal(existing.format(['A', 'B']), 'A and B', 'old instance keeps data')
Native.__addLocaleData(fixtures.packs[0])

const lists: string[][] = [
  [],
  [''],
  ['A'],
  ['A', 'B'],
  ['', ''],
  ['', 'B', ''],
  ['😀', 'e\u0301', '東京'],
  ['\ud800', '\udc00'],
  ['{0}', '{1}', '\u0000'],
]
for (let length = 0; length < 22; length++)
  lists.push(
    Array.from({length}, (_, index) => (index % 3 ? `${index}😀` : ''))
  )
for (let index = 0; index < fixtures.packs.length; index++) {
  const locale = JSON.parse(fixtures.packs[index]).locale as string
  for (const type of ['conjunction', 'disjunction', 'unit'] as const)
    for (const style of ['long', 'short', 'narrow'] as const) {
      const candidate = new Native(locale, {type, style})
      const reference = new TypeScriptListFormat(locale, {type, style})
      equal(
        candidate.resolvedOptions(),
        reference.resolvedOptions(),
        locale + '/options'
      )
      for (const list of lists) {
        equal(
          candidate.format(list),
          reference.format(list),
          locale + '/format'
        )
        equal(
          candidate.formatToParts(list),
          reference.formatToParts(list),
          locale + '/parts'
        )
        cases++
      }
    }
}
const formatter = new Native('en')
equal(formatter.format(undefined), '', 'undefined iterable')
equal(
  formatter.formatToParts(['']),
  [{type: 'element', value: ''}],
  'empty element survives'
)
equal(formatter.format('😀A'), '😀 and A', 'string iterates code points')
for (const value of [null, 1, true, {}, {length: 1, 0: 'A'}])
  throws(() => formatter.format(value), TypeError, 'requires iterable')
for (const value of [1, null, undefined, {}, new String('A'), Symbol(), 1n])
  throws(
    () => formatter.format(['A', value]),
    TypeError,
    'requires primitive string elements'
  )
let closed = 0,
  coerced = 0
const invalid = {
  [Symbol.iterator]() {
    return {
      next() {
        return {
          done: false,
          value: {
            toString() {
              coerced++
              return 'bad'
            },
          },
        }
      },
      return() {
        closed++
        return {}
      },
    }
  },
}
throws(() => formatter.format(invalid), TypeError, 'invalid element throws')
equal([closed, coerced], [1, 0], 'IteratorClose without coercion')
let iterated = 0
const iterable = {
  [Symbol.iterator]() {
    iterated++
    return [][Symbol.iterator]()
  },
}
throws(
  () => Native.prototype.format.call({}, iterable),
  TypeError,
  'brand before iteration'
)
equal(iterated, 0, 'bad receiver never iterates')
for (const method of ['format', 'formatToParts', 'resolvedOptions']) {
  const fn = Native.prototype[method]
  equal(fn.name, method, 'method name')
  equal(fn.length, method === 'resolvedOptions' ? 0 : 1, 'method arity')
  throws(() => new fn(), TypeError, 'method not constructable')
  throws(() => fn.call(Native.prototype), TypeError, 'prototype not branded')
  throws(
    () => fn.call(new Proxy(formatter, {})),
    TypeError,
    'proxy not branded'
  )
}
equal(Native.length, 0, 'constructor arity')
equal(Native.supportedLocalesOf.length, 1, 'supportedLocalesOf arity')
equal(
  Object.keys(formatter.resolvedOptions()),
  ['locale', 'type', 'style'],
  'resolved property order'
)
equal(
  Object.prototype.toString.call(formatter),
  '[object Intl.ListFormat]',
  'toStringTag'
)
throws(() => Native(), TypeError, 'requires new')
class Derived extends Native {
  constructor(...args: any[]) {
    super(...args)
  }
}
check(new Derived('en') instanceof Derived, 'subclass receiver')
const customPrototype = {}
function Target() {}
Target.prototype = customPrototype
const custom = Reflect.construct(Native, ['en'], Target)
check(
  Object.getPrototypeOf(custom) === customPrototype,
  'custom newTarget prototype'
)
equal(
  Native.prototype.format.call(custom, ['A', 'B']),
  'A and B',
  'custom receiver branded'
)
const order: string[] = []
const opts = {
  get localeMatcher() {
    order.push('matcher')
    return 'lookup'
  },
  get type() {
    order.push('type')
    return {
      toString() {
        order.push('type string')
        return 'unit'
      },
    }
  },
  get style() {
    order.push('style')
    return 'narrow'
  },
}
new Native('en', opts)
equal(order, ['matcher', 'type', 'type string', 'style'], 'enum coercion order')
let styleRead = false
throws(
  () =>
    new Native('en', {
      type: 'invalid',
      get style() {
        styleRead = true
        return 'long'
      },
    }),
  RangeError,
  'invalid type'
)
check(!styleRead, 'type validation before style getter')
let optionsRead = false
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
check(!optionsRead, 'locale validation before options')
throws(() => new Native('en', null), TypeError, 'null options')
equal(
  Native.supportedLocalesOf(['fr-FR-u-nu-latn']),
  ['fr-FR-u-nu-latn'],
  'preserves supported extensions'
)
const localeObject = new Intl.Locale('fr')
localeObject.toString = () => {
  throw new Error('must use Locale brand')
}
equal(
  new Native(localeObject).resolvedOptions().locale,
  'fr',
  'Locale intrinsic brand'
)
const first = formatter.formatToParts(['A', 'B'])
first[0].value = 'changed'
equal(formatter.formatToParts(['A', 'B'])[0].value, 'A', 'fresh parts')
const result = formatter.resolvedOptions()
result.locale = 'changed'
equal(formatter.resolvedOptions().locale, 'en', 'fresh options')

const originalParse = JSON.parse,
  originalStringify = JSON.stringify
const originalCharCodeAt = String.prototype.charCodeAt,
  originalFromCharCode = String.fromCharCode
const originalApply = Reflect.apply,
  originalGet = WeakMap.prototype.get,
  originalSet = WeakMap.prototype.set
function poisoned(): never {
  throw new Error('tampered intrinsic called')
}
try {
  JSON.parse = poisoned
  JSON.stringify = poisoned
  String.prototype.charCodeAt = poisoned
  String.fromCharCode = poisoned
  Reflect.apply = poisoned
  WeakMap.prototype.get = poisoned
  WeakMap.prototype.set = poisoned
  equal(
    new Native('en').format(['\ud800', 'B']),
    '\ud800 and B',
    'captured intrinsics'
  )
  equal(
    formatter.formatToParts(['A', 'B']),
    [
      {type: 'element', value: 'A'},
      {type: 'literal', value: ' and '},
      {type: 'element', value: 'B'},
    ],
    'captured parts intrinsics'
  )
} finally {
  JSON.parse = originalParse
  JSON.stringify = originalStringify
  String.prototype.charCodeAt = originalCharCodeAt
  String.fromCharCode = originalFromCharCode
  Reflect.apply = originalApply
  WeakMap.prototype.get = originalGet
  WeakMap.prototype.set = originalSet
}
root.print(
  stringify({
    type: 'ListFormat-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    onDemand: true,
    cases,
    assertions,
  })
)
