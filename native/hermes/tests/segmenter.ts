import {Segmenter as TypeScriptSegmenter} from '@formatjs/intl-segmenter'
const Native = Intl.Segmenter as any
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
  'Rust Segmenter installed'
)
const inputs = [
  '',
  'a',
  'Hello, world! 123',
  'One. Two! Three?',
  'a\r\nb',
  'foo_bar',
  '3.14 + 1,234.50',
  '\ud800a\udc00',
]
for (const locale of ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh']) {
  for (const granularity of ['grapheme', 'word', 'sentence'] as const) {
    const model = new Native(locale, {granularity})
    const reference = new TypeScriptSegmenter(locale, {granularity})
    equal(
      model.resolvedOptions(),
      reference.resolvedOptions(),
      'resolved options'
    )
    for (const input of inputs) {
      const segments = model.segment(input)
      const expected = reference.segment(input)
      equal(Array.from(segments), Array.from(expected), 'TS segment records')
      for (let index = 0; index <= input.length; index++)
        equal(
          segments.containing(index),
          expected.containing(index),
          'TS containing record'
        )
      cases++
    }
  }
}
const grapheme = new Native('en')
const input = 'á😀👩‍👩‍👧‍👦🇺🇸\r\n'
const segments = grapheme.segment(input)
equal(
  Array.from(segments, (part: any) => part.index),
  [0, 2, 4, 15, 19],
  'UTF-16 boundaries'
)
equal(
  segments.containing(3),
  {segment: '😀', index: 2, input},
  'inside surrogate pair'
)
for (const index of [NaN, undefined, null, -0.5, -0])
  equal(
    segments.containing(index),
    segments.containing(0),
    'ToIntegerOrInfinity zero'
  )
for (const index of [-1, Infinity, -Infinity, input.length, 1e100])
  check(segments.containing(index) === undefined, 'out-of-range index')
for (const value of [
  1n,
  Object(1n),
  Symbol('index'),
  {
    [Symbol.toPrimitive]() {
      return 1n
    },
  },
])
  throws(
    () => segments.containing(value),
    TypeError,
    'ToNumber rejects BigInt/Symbol'
  )
const first = segments[Symbol.iterator](),
  second = segments[Symbol.iterator]()
check(first[Symbol.iterator]() === first, 'inherited iterator identity')
equal(first.next(), second.next(), 'independent first result')
first.next()
equal(second.next().value.index, 2, 'second cursor progress independent')
const empty = grapheme.segment('')[Symbol.iterator]()
equal(empty.next(), {value: undefined, done: true}, 'empty exhausted')
equal(empty.next(), {value: undefined, done: true}, 'stable exhaustion')
check(empty.next() !== empty.next(), 'fresh exhaustion result')
check(
  Object.getPrototypeOf(first.next()) === Object.prototype,
  'ordinary iterator result'
)
equal(
  Object.keys(segments.containing(2)),
  ['segment', 'index', 'input'],
  'grapheme record order'
)
equal(
  Object.keys(
    new Native('en', {granularity: 'word'}).segment('hello').containing(0)
  ),
  ['segment', 'index', 'input', 'isWordLike'],
  'word record order'
)
equal(
  Object.keys(grapheme.resolvedOptions()),
  ['locale', 'granularity'],
  'resolved property order'
)
check(
  grapheme.resolvedOptions() !== grapheme.resolvedOptions(),
  'fresh resolved options'
)
equal(
  Object.prototype.toString.call(grapheme),
  '[object Intl.Segmenter]',
  'segmenter tag'
)
equal(
  Object.prototype.toString.call(first),
  '[object Segmenter String Iterator]',
  'iterator tag'
)
check(
  Object.getPrototypeOf(Object.getPrototypeOf(first)) ===
    Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())),
  'intrinsic iterator prototype'
)
const segmentPrototype = Object.getPrototypeOf(segments),
  cursorPrototype = Object.getPrototypeOf(first)
for (const [method, receiver, args] of [
  [
    Native.prototype.segment,
    {},
    [
      {
        toString() {
          throw new Error('coercion before brand')
        },
      },
    ],
  ],
  [Native.prototype.resolvedOptions, Object.create(Native.prototype), []],
  [
    segmentPrototype.containing,
    {},
    [
      {
        valueOf() {
          throw new Error('coercion before brand')
        },
      },
    ],
  ],
  [segmentPrototype[Symbol.iterator], {}, []],
  [cursorPrototype.next, {}, []],
] as const)
  throws(
    () => Reflect.apply(method, receiver, args),
    TypeError,
    'private brands'
  )
throws(
  () => grapheme.segment(Symbol('input')),
  TypeError,
  'ToString rejects Symbol'
)
equal(
  Array.from(grapheme.segment(undefined), (part: any) => part.segment).join(''),
  'undefined',
  'undefined ToString'
)
let hint = ''
grapheme.segment({
  [Symbol.toPrimitive](value: string) {
    hint = value
    return 'abc'
  },
})
equal(hint, 'string', 'ToString hint')
for (const options of [null, false, 1, 'word', Symbol('options')])
  throws(
    () => new Native('en', options),
    TypeError,
    'constructor options object'
  )
throws(() => Native(), TypeError, 'new required')
throws(() => new Native('en_US'), RangeError, 'invalid locale')
for (const name of ['granularity', 'localeMatcher'])
  throws(() => new Native('en', {[name]: 'bad'}), RangeError, 'invalid option')
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
    get localeMatcher() {
      order.push('localeMatcher')
      return 'lookup'
    },
    get granularity() {
      order.push('granularity')
      return 'word'
    },
  }
)
equal(
  order,
  ['locale', 'localeMatcher', 'granularity'],
  'observable read order'
)
let reads = 0
const target = new Proxy(function Target() {}, {
  get(target, key, receiver) {
    if (key === 'prototype') reads++
    return Reflect.get(target, key, receiver)
  },
})
Reflect.construct(Native, [], target)
equal(reads, 1, 'one newTarget.prototype Get')
class Derived extends Native {}
check(new Derived() instanceof Derived, 'subclass prototype')
equal(Native.length, 0, 'constructor length')
equal(Native.supportedLocalesOf.length, 1, 'supportedLocalesOf length')
equal(Native.prototype.segment.length, 1, 'segment length')
equal(segmentPrototype.containing.length, 1, 'containing length')
equal(cursorPrototype.next.length, 0, 'next length')
equal(
  Native.supportedLocalesOf(['zz-ZZ', 'en-US-u-nu-arab']),
  ['en-US-u-nu-arab'],
  'supported extension preserved'
)
const words = new Native('en', {granularity: 'word'})
for (const [text, expected] of [
  ['こんにちは世界', ['こんにちは', '世界']],
  ['ทุกสองสัปดาห์', ['ทุก', 'สอง', 'สัปดาห์']],
] as const)
  equal(
    Array.from(words.segment(text), (part: any) => part.segment),
    expected,
    'complex-script model'
  )
equal(
  Array.from(words.segment('नमस्ते दुनिया।'), (part: any) => part.isWordLike),
  [true, false, true, false],
  'Indic word status'
)
for (const text of ['\u0308', '❤️'])
  equal(
    Array.from(words.segment(text), (part: any) => part.isWordLike),
    [false],
    'marks alone not word-like'
  )
// Parsed ABI records must not consult inherited fields for optional word status.
Object.defineProperty(Object.prototype, 'isWordLike', {
  configurable: true,
  get() {
    throw new Error('inherited isWordLike getter')
  },
})
try {
  const part = grapheme.segment('a').containing(0)
  check(
    !Object.prototype.hasOwnProperty.call(part, 'isWordLike'),
    'grapheme omits word status'
  )
  check(
    words.segment('hello').containing(0).isWordLike === true,
    'word status is own data'
  )
} finally {
  delete (Object.prototype as any).isWordLike
}
for (const [name, Model] of [
  ['native', Native],
  ['typescript', TypeScriptSegmenter],
] as const) {
  const model = new Model('en', {granularity: 'grapheme'})
  for (const receiver of [
    {},
    Object.create(Model.prototype),
    new Proxy(model, {
      get() {
        throw new Error('proxy property Get')
      },
    }),
  ]) {
    let coerced = false
    throws(
      () =>
        Model.prototype.segment.call(receiver, {
          toString() {
            coerced = true
            throw new Error('input coercion')
          },
        }),
      TypeError,
      name + ' brand before input coercion'
    )
    check(!coerced, name + ' invalid brand leaves input untouched')
  }
  check(
    Object.keys(model).length === 0,
    name + ' model hides implementation state'
  )
  const other = Reflect.construct(
    Model,
    ['en', {granularity: 'grapheme'}],
    function Other() {}
  )
  equal(
    Array.from(
      Model.prototype.segment.call(other, 'a'),
      (part: any) => part.segment
    ),
    ['a'],
    name + ' brand independent of newTarget prototype'
  )
  for (const key of [
    'rules',
    'ruleSortedKeys',
    'mergedSegmentationTypeValue',
    'breaksAt',
  ])
    Object.defineProperty(model, key, {
      configurable: true,
      get() {
        throw new Error('observable model state: ' + key)
      },
    })
  const collection = model.segment('a')
  const cursor = collection[Symbol.iterator]()
  equal(
    cursor.next().value.segment,
    'a',
    name + ' ignores user model properties'
  )
  check(
    Object.keys(collection).length === 0 && Object.keys(cursor).length === 0,
    name + ' segments and cursor hide state'
  )
  check(
    !Object.prototype.hasOwnProperty.call(
      Object.getPrototypeOf(collection),
      'constructor'
    ),
    name + ' segment constructor stays private'
  )
  check(
    !Object.prototype.hasOwnProperty.call(
      Object.getPrototypeOf(cursor),
      'constructor'
    ),
    name + ' cursor constructor stays private'
  )
}
// Record creation must bypass inherited accessors, including iterator results.
const recordModels = [
  {name: 'native', grapheme, words},
  {
    name: 'typescript',
    grapheme: new TypeScriptSegmenter('en', {granularity: 'grapheme'}),
    words: new TypeScriptSegmenter('en', {granularity: 'word'}),
  },
]
const poisoned = ['segment', 'index', 'input', 'isWordLike', 'value', 'done']
for (const name of poisoned) {
  const descriptor = Object.create(null)
  descriptor.configurable = true
  descriptor.get = () => {
    throw new Error('inherited record getter: ' + name)
  }
  descriptor.set = () => {
    throw new Error('inherited record setter: ' + name)
  }
  Object.defineProperty(Object.prototype, name, descriptor)
}
try {
  for (const {name, grapheme, words} of recordModels) {
    const iterable = grapheme.segment('a')
    const cursor = iterable[Symbol.iterator]()
    const first = cursor.next()
    equal(
      Object.keys(first),
      ['value', 'done'],
      name + ' iterator result key order'
    )
    equal(
      first,
      {value: {segment: 'a', index: 0, input: 'a'}, done: false},
      'own segment data under poisoned prototypes'
    )
    equal(
      iterable.containing(0),
      {segment: 'a', index: 0, input: 'a'},
      'containing owns data'
    )
    equal(
      words.segment('hello').containing(0),
      {segment: 'hello', index: 0, input: 'hello', isWordLike: true},
      'word owns all data'
    )
    const done = cursor.next()
    const again = cursor.next()
    check(done !== again && done.done && again.done, 'fresh exhausted results')
    for (const result of [first, done, again]) {
      check(
        Object.getPrototypeOf(result) === Object.prototype,
        'ordinary iterator result'
      )
      for (const name of ['value', 'done']) {
        const descriptor = Object.getOwnPropertyDescriptor(result, name)!
        check(
          descriptor.writable &&
            descriptor.enumerable &&
            descriptor.configurable,
          'iterator data property attributes'
        )
      }
    }
  }
} finally {
  for (const name of poisoned) delete (Object.prototype as any)[name]
}
;(globalThis as any).print(
  JSON.stringify({
    type: 'Segmenter-conformance',
    candidate: 'Rust JSI installed API',
    reference: 'TypeScript implementation',
    cases,
    assertions,
  })
)
