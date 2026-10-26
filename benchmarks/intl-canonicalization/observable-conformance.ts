export type Canonicalizer = (input?: any) => string[]

type Outcome = string[] | {error: string}
type Case = {
  name: string
  run: (method: Canonicalizer, trace: string[], sentinel: object) => unknown
  expected: Outcome
  trace?: string[]
}
type Equal = (actual: unknown, expected: unknown, label: string) => void

// Fresh inputs keep mutations and Proxy traces independent between implementations.
export function checkObservableConformance(
  candidate: Canonicalizer,
  reference: Canonicalizer,
  equal: Equal
): {
  cases: number
  assertions: number
  localeCases: number
  invalidTags: number
} {
  if (typeof Intl.Locale !== 'function')
    throw new Error('Conformance requires the trusted Intl.Locale prelude')
  let assertions = 0
  const check: Equal = (actual, expected, label) => {
    assertions++
    equal(actual, expected, label)
  }
  check(candidate === reference, false, 'independent implementations')
  const cases: Case[] = []
  const add = (
    name: string,
    make: (trace: string[], sentinel: object) => unknown,
    expected: Outcome,
    trace: string[] = []
  ) => {
    cases.push({
      name,
      run: (method, events, sentinel) => method(make(events, sentinel)),
      expected,
      trace,
    })
  }
  const typeError = {error: 'TypeError'}
  const rangeError = {error: 'RangeError'}
  const abrupt = {error: 'sentinel'}

  for (const value of [undefined, false, true, 0, 42, NaN, 0n, Symbol('list')])
    add('top-level primitive ' + String(value), () => value, [])
  add('null list', () => null, typeError)
  for (const value of [
    undefined,
    null,
    false,
    true,
    0,
    42,
    1n,
    Symbol('entry'),
  ])
    add('invalid entry ' + String(value), () => [value], typeError)
  for (const length of [undefined, null, NaN, -1, -Infinity, 0, -0.5, '0'])
    add('empty ToLength ' + String(length), () => ({0: 'bad_tag', length}), [])
  for (const length of [1, 1.9, '1.9', true])
    add('positive ToLength ' + String(length), () => ({0: 'IW', length}), [
      'he',
    ])
  for (const length of [1n, Symbol('length')])
    add('invalid length ' + String(length), () => ({length}), typeError)

  add(
    'inherited indices and length',
    () => Object.create({0: 'IW', 2: 'FR', length: 3}),
    ['he', 'fr']
  )
  add('boxed string entry', () => [new String('IW')], ['he'])
  add(
    'iterator ignored',
    (_trace, sentinel) => ({
      0: 'FR',
      length: 1,
      get [Symbol.iterator]() {
        throw sentinel
      },
    }),
    ['fr']
  )
  add(
    'Locale-shaped object is array-like',
    (_trace, sentinel) => ({
      0: 'DE',
      length: 1,
      get language() {
        throw sentinel
      },
      get baseName() {
        throw sentinel
      },
    }),
    ['de']
  )
  add(
    'function list is not called',
    (_trace, sentinel) => {
      const input = function (_a: unknown, _b: unknown) {
        throw sentinel
      }
      Object.assign(input, {0: 'IW', 1: 'FR'})
      return input
    },
    ['he', 'fr']
  )
  add(
    'function entry coerces to string',
    () => {
      const entry = function () {
        throw new Error('entry invoked')
      }
      entry.toString = () => 'FR'
      return [entry]
    },
    ['fr']
  )
  add(
    'primitive conversion string hint',
    trace => [
      {
        [Symbol.toPrimitive](hint: string) {
          trace.push(hint)
          return 'IW'
        },
      },
    ],
    ['he'],
    ['string']
  )
  add(
    'ordinary string conversion order',
    trace => [
      {
        toString() {
          trace.push('toString')
          return {}
        },
        valueOf() {
          trace.push('valueOf')
          return 'FR'
        },
      },
    ],
    ['fr'],
    ['toString', 'valueOf']
  )
  add(
    'noncallable toString falls back',
    trace => [
      {
        toString: null,
        valueOf() {
          trace.push('valueOf')
          return 'DE'
        },
      },
    ],
    ['de'],
    ['valueOf']
  )
  add(
    'object conversion returns no primitive',
    trace => [
      {
        toString() {
          trace.push('toString')
          return {}
        },
        valueOf() {
          trace.push('valueOf')
          return {}
        },
      },
    ],
    typeError,
    ['toString', 'valueOf']
  )
  add(
    'object conversion returns symbol',
    () => [
      {
        [Symbol.toPrimitive]() {
          return Symbol('tag')
        },
      },
    ],
    typeError
  )
  add(
    'length number hint before indices',
    trace => ({
      0: 'FR',
      get length() {
        trace.push('length')
        return {
          [Symbol.toPrimitive](hint: string) {
            trace.push(hint)
            return 1.9
          },
        }
      },
    }),
    ['fr'],
    ['length', 'number']
  )
  add(
    'length read only once',
    trace => ({
      get length() {
        trace.push('length')
        return 2
      },
      get 0() {
        trace.push('get:0')
        Object.defineProperty(this, 'length', {value: 0})
        return 'IW'
      },
      get 1() {
        trace.push('get:1')
        return 'FR'
      },
    }),
    ['he', 'fr'],
    ['length', 'get:0', 'get:1']
  )
  add(
    'HasProperty observes deletion and insertion',
    trace => {
      const target: any = {1: 'FR', length: 3}
      Object.defineProperty(target, '0', {
        get() {
          delete target[1]
          target[2] = 'DE'
          return 'IW'
        },
      })
      return new Proxy(target, {
        get(object, key) {
          trace.push('get:' + String(key))
          return Reflect.get(object, key)
        },
        has(object, key) {
          trace.push('has:' + String(key))
          return Reflect.has(object, key)
        },
      })
    },
    ['he', 'de'],
    ['get:length', 'has:0', 'get:0', 'has:1', 'has:2', 'get:2']
  )
  add(
    'duplicate entries still convert',
    trace => [
      'IW',
      {
        toString() {
          trace.push('duplicate conversion')
          return 'he'
        },
      },
      'FR',
    ],
    ['he', 'fr'],
    ['duplicate conversion']
  )

  add(
    'length getter abrupt completion',
    (trace, sentinel) => ({
      get length() {
        trace.push('length')
        throw sentinel
      },
    }),
    abrupt,
    ['length']
  )
  add(
    'length conversion abrupt completion',
    (trace, sentinel) => ({
      length: {
        valueOf() {
          trace.push('valueOf')
          throw sentinel
        },
      },
    }),
    abrupt,
    ['valueOf']
  )
  add(
    'HasProperty abrupt completion',
    (trace, sentinel) =>
      new Proxy(
        {length: 2},
        {
          has(_target, key) {
            trace.push('has:' + String(key))
            throw sentinel
          },
        }
      ),
    abrupt,
    ['has:0']
  )
  add(
    'index getter stops iteration',
    (trace, sentinel) => ({
      length: 2,
      get 0() {
        trace.push('get:0')
        throw sentinel
      },
      get 1() {
        trace.push('get:1')
        return 'FR'
      },
    }),
    abrupt,
    ['get:0']
  )
  add(
    'entry conversion stops iteration',
    (trace, sentinel) => ({
      length: 2,
      0: {
        [Symbol.toPrimitive](hint: string) {
          trace.push(hint)
          throw sentinel
        },
      },
      get 1() {
        trace.push('get:1')
        return 'FR'
      },
    }),
    abrupt,
    ['string']
  )
  add(
    'invalid tag stops iteration',
    trace => ({
      length: 2,
      0: 'en_US',
      get 1() {
        trace.push('get:1')
        return 'FR'
      },
    }),
    rangeError
  )
  add(
    'ToString getter abrupt completion',
    (trace, sentinel) => [
      {
        get toString() {
          trace.push('get:toString')
          throw sentinel
        },
      },
    ],
    abrupt,
    ['get:toString']
  )
  add(
    'revoked Proxy list',
    () => {
      const {proxy, revoke} = Proxy.revocable({}, {})
      revoke()
      return proxy
    },
    typeError
  )
  for (const length of [Infinity, 9007199254740992])
    add(
      'large ToLength begins iteration ' + String(length),
      (trace, sentinel) =>
        new Proxy(
          {length},
          {
            has(_target, key) {
              trace.push('has:' + String(key))
              throw sentinel
            },
          }
        ),
      abrupt,
      ['has:0']
    )

  const localeStart = cases.length
  for (const input of ['EN-us', 'IW-il', 'fr-u-ca-buddhist']) {
    const expected =
      input === 'EN-us' ? 'en-US' : input === 'IW-il' ? 'he-IL' : input
    add('Locale singleton ' + input, () => new Intl.Locale(input), [expected])
    add('Locale entry ' + input, () => [new Intl.Locale(input)], [expected])
  }
  add(
    'Locale own conversion hooks ignored',
    (_trace, sentinel) => {
      const locale = new Intl.Locale('IW-il')
      Object.defineProperties(locale, {
        toString: {
          get() {
            throw sentinel
          },
        },
        [Symbol.toPrimitive]: {
          get() {
            throw sentinel
          },
        },
      })
      return [locale]
    },
    ['he-IL']
  )
  add(
    'Locale subclass brand',
    () => {
      class LocaleSubclass extends Intl.Locale {}
      return [new LocaleSubclass('EN-us')]
    },
    ['en-US']
  )
  add(
    'Locale deduplication with strings',
    () => [new Intl.Locale('IW'), 'he', new Intl.Locale('FR')],
    ['he', 'fr']
  )
  add(
    'Locale prototype without slots',
    () => [Object.create(Intl.Locale.prototype)],
    typeError
  )
  add(
    'Proxy Locale has no slots',
    () => [new Proxy(new Intl.Locale('EN'), {})],
    typeError
  )
  cases.push({
    name: 'captured Locale intrinsic survives replacement',
    run(method, _trace, sentinel) {
      const locale = new Intl.Locale('IW')
      const intrinsic = Intl.Locale.prototype.toString
      Intl.Locale.prototype.toString = function () {
        throw sentinel
      }
      try {
        return method([locale])
      } finally {
        Intl.Locale.prototype.toString = intrinsic
      }
    },
    expected: ['he'],
  })
  const localeCases = cases.length - localeStart
  cases.push({
    name: 'receiver is ignored',
    run(method, _trace, sentinel) {
      const receiver = new Proxy(
        {},
        {
          get() {
            throw sentinel
          },
        }
      )
      return Reflect.apply(method, receiver, [['IW', 'FR']])
    },
    expected: ['he', 'fr'],
  })
  cases.push({
    name: 'RegExp statics preserved',
    run(method, trace) {
      ;/sent(inel)/.exec('sentinel')
      const result = method(['IW', 'en-u-kn-yes'])
      trace.push(RegExp.lastMatch, RegExp.$1)
      return result
    },
    expected: ['he', 'en-u-kn'],
    trace: ['sentinel', 'inel'],
  })

  function observe(test: Case, method: Canonicalizer) {
    const trace: string[] = []
    const sentinel = {}
    try {
      const result = test.run(method, trace, sentinel)
      const length = Array.isArray(result)
        ? Object.getOwnPropertyDescriptor(result, 'length')
        : undefined
      const arrayProperties = Boolean(
        Array.isArray(result) &&
        Object.getPrototypeOf(result) === Array.prototype &&
        length?.writable &&
        !length.enumerable &&
        !length.configurable &&
        Reflect.ownKeys(result).length === result.length + 1 &&
        result.every((value, index) => {
          const property = Object.getOwnPropertyDescriptor(
            result,
            String(index)
          )
          return (
            property?.value === value &&
            property.writable &&
            property.enumerable &&
            property.configurable
          )
        })
      )
      return {outcome: result, trace, arrayProperties}
    } catch (error) {
      return {
        outcome: {
          error:
            error === sentinel
              ? 'sentinel'
              : error instanceof Error
                ? error.name
                : typeof error,
        },
        trace,
      }
    }
  }
  for (const test of cases) {
    const actual = observe(test, candidate)
    const baseline = observe(test, reference)
    const expected = {
      outcome: test.expected,
      trace: test.trace || [],
      ...(Array.isArray(test.expected) ? {arrayProperties: true} : {}),
    }
    check(actual, expected, 'candidate ' + test.name)
    check(baseline, expected, 'TypeScript ' + test.name)
    check(actual, baseline, 'differential ' + test.name)
  }

  const invalidSuffixes = [
    '--US',
    '_US',
    '-u',
    '-t',
    '-a',
    '-x',
    '-a-f',
    '-t-d0',
    '-t-m0-xx',
    '-u-a1-foo',
    '-u--ca',
    '-u-ca-gregory--nu-latn',
    '-x-123456789',
    '-a-123456789',
    '-US-US',
    '-1996-1996',
    '-a-foo-A-bar',
    '-u-ca-gregory-U-nu-latn',
    '-t-en-1996-1996',
    '-ü',
  ]
  let invalidTags = 0
  for (const language of ['en', 'sh', 'hye', 'und', 'posix', 'abcde']) {
    for (const suffix of invalidSuffixes) {
      const test: Case = {
        name: language + suffix,
        run: method => method(language + suffix),
        expected: rangeError,
      }
      const actual = observe(test, candidate)
      const baseline = observe(test, reference)
      const expected = {outcome: rangeError, trace: []}
      check(actual, expected, 'candidate invalid ' + test.name)
      check(baseline, expected, 'TypeScript invalid ' + test.name)
      check(actual, baseline, 'differential invalid ' + test.name)
      invalidTags++
    }
  }

  const descriptor = Object.getOwnPropertyDescriptor(
    Intl,
    'getCanonicalLocales'
  )!
  check(
    [
      descriptor.value === candidate,
      descriptor.writable,
      descriptor.enumerable,
      descriptor.configurable,
    ],
    [true, true, false, true],
    'installed API descriptor'
  )
  check(
    [
      candidate.name,
      candidate.length,
      Object.getOwnPropertyDescriptor(candidate, 'prototype') !== undefined,
    ],
    ['getCanonicalLocales', 1, false],
    'installed API function shape'
  )
  let constructError: unknown
  try {
    Reflect.construct(candidate, [])
  } catch (error) {
    constructError = error
  }
  check(
    constructError instanceof TypeError,
    true,
    'installed API is not constructible'
  )
  for (const method of [candidate, reference]) {
    const first = method(['EN'])
    const second = method(['EN'])
    check(first === second, false, 'fresh result identity')
    first[0] = 'fr'
    check(second, ['en'], 'result mutation isolation')
  }
  return {cases: cases.length, assertions, localeCases, invalidTags}
}
