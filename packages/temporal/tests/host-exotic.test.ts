import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {runInThisContext} from 'node:vm'
import {setFlagsFromString} from 'node:v8'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

type HostExotic = Record<PropertyKey, unknown> &
  ((...args: unknown[]) => unknown)
function hostObject(fields: Record<string, unknown> = {}): HostExotic {
  setFlagsFromString('--allow-natives-syntax')
  try {
    return Object.assign(
      runInThisContext('%GetUndetectable()') as HostExotic,
      fields
    )
  } finally {
    setFlagsFromString('--no-allow-natives-syntax')
  }
}

it('reads host-exotic field bags for every supported Temporal conversion', () => {
  const date = hostObject({year: 2024, month: 2, day: 29})
  expect(Temporal.PlainDate.from(date).toString()).toBe('2024-02-29')
  expect(Temporal.PlainDateTime.from(date).toString()).toBe(
    '2024-02-29T00:00:00'
  )
  expect(Temporal.PlainYearMonth.from(date).toString()).toBe('2024-02')
  expect(Temporal.PlainMonthDay.from(date).toString()).toBe('02-29')
  expect(Temporal.PlainTime.from(hostObject({hour: 12})).hour).toBe(12)
  expect(Temporal.Duration.from(hostObject({hours: 2})).hours).toBe(2)
  expect(
    Temporal.Duration.from('PT1H').with(hostObject({minutes: 3})).minutes
  ).toBe(3)
  expect(
    Temporal.ZonedDateTime.from(
      hostObject({year: 2024, month: 2, day: 29, timeZone: 'UTC'})
    ).day
  ).toBe(29)
})

it('reads host-exotic options and primitive coercion hooks', () => {
  const options = hostObject({overflow: 'reject'})
  expect(() =>
    Temporal.PlainDate.from({year: 2024, month: 2, day: 30}, options)
  ).toThrow(RangeError)
  expect(
    new Temporal.Instant(1n).round(hostObject({smallestUnit: 'second'}))
      .epochNanoseconds
  ).toBe(0n)
  const value = hostObject()
  value[Symbol.toPrimitive] = function (hint: string) {
    expect(this).toBe(value)
    expect(hint).toBe('number')
    return 42n
  }
  expect(new Temporal.Instant(value).epochNanoseconds).toBe(42n)
})

it.each([
  [Temporal.Instant, [0n]],
  [Temporal.Duration, []],
  [Temporal.PlainDate, [2024, 2, 29]],
  [Temporal.PlainDateTime, [2024, 2, 29]],
  [Temporal.PlainTime, []],
  [Temporal.PlainYearMonth, [2024, 2]],
  [Temporal.PlainMonthDay, [2, 29]],
  [Temporal.ZonedDateTime, [0n, 'UTC']],
])('uses host-exotic newTarget.prototype for %s', (Constructor, args) => {
  const prototype = hostObject()
  function Target() {}
  Target.prototype = prototype
  expect(
    Object.getPrototypeOf(Reflect.construct(Constructor, args, Target))
  ).toBe(prototype)
})

it('coerces undetectable locale entries as objects with the string hint', () => {
  const value = hostObject()
  const hints: string[] = []
  value[Symbol.toPrimitive] = function (hint: string) {
    expect(this).toBe(value)
    hints.push(hint)
    return 'en-us'
  }
  expect(getCanonicalLocales([value] as any)).toEqual(['en-US'])
  expect(getCanonicalLocales(hostObject({0: value, length: 1}) as any)).toEqual(
    ['en-US']
  )
  expect(hints).toEqual(['string', 'string'])
})

it('propagates undetectable locale coercion failures before later entries', () => {
  const value = hostObject()
  const failure = new Error('Locale coercion failure')
  value[Symbol.toPrimitive] = () => {
    throw failure
  }
  let caught: unknown
  try {
    getCanonicalLocales({
      0: value,
      get 1() {
        throw new Error('Later locale read')
      },
      length: 2,
    } as any)
  } catch (error) {
    caught = error
  }
  expect(caught).toBe(failure)
})

it.each([
  [Temporal.Instant, [0n]],
  [Temporal.Duration, []],
  [Temporal.PlainDate, [2024, 2, 29]],
  [Temporal.PlainDateTime, [2024, 2, 29]],
  [Temporal.PlainTime, []],
  [Temporal.PlainYearMonth, [2024, 2]],
  [Temporal.PlainMonthDay, [2, 29]],
  [Temporal.ZonedDateTime, [0n, 'UTC']],
])(
  'checks newTarget realm only after a primitive prototype for %s',
  (Constructor, args) => {
    for (const prototype of [{}, null]) {
      let prototypeGets = 0
      let receiver: unknown
      const pair = Proxy.revocable(
        function Target() {
          throw new Error('newTarget body must not run')
        },
        {
          get(_target, key, originalReceiver) {
            if (key !== 'prototype')
              throw new Error('Unexpected newTarget read')
            prototypeGets++
            receiver = originalReceiver
            pair.revoke()
            return prototype
          },
        }
      )
      if (prototype === null) {
        // ECMA-262 §10.1.14 step 5; §7.3.24 step 3.a rejects revoked newTarget.
        expect(() => Reflect.construct(Constructor, args, pair.proxy)).toThrow(
          TypeError
        )
      } else {
        // ECMA-262 §10.1.14 step 3 returns object prototype before realm lookup.
        const result = Reflect.construct(Constructor, args, pair.proxy)
        expect(Object.getPrototypeOf(result)).toBe(prototype)
      }
      expect(prototypeGets).toBe(1)
      expect(receiver).toBe(pair.proxy)
    }
  }
)

it('does not inspect newTarget descriptors during primitive prototype fallback', () => {
  const events: string[] = []
  const Target = new Proxy(
    function Target() {
      throw new Error('newTarget body must not run')
    },
    {
      get(_target, key, receiver) {
        events.push(`get ${String(key)}`)
        expect(receiver).toBe(Target)
        return null
      },
      getOwnPropertyDescriptor() {
        throw new Error('Unexpected newTarget descriptor lookup')
      },
    }
  )
  const result = Reflect.construct(Temporal.Instant, [0n], Target)
  expect(Object.getPrototypeOf(result)).toBe(Temporal.Instant.prototype)
  expect(events).toEqual(['get prototype'])
})

it.each([
  ['live', null],
  ['revoked', null],
  ['revoked', {}],
] as const)(
  'uses one prototype Get for a %s bound newTarget with prototype %s',
  (state, prototype) => {
    const events: string[] = []
    const pair = Proxy.revocable(function Target() {
      throw new Error('newTarget body must not run')
    }, {})
    const bound = pair.proxy.bind(null)
    const wrapped = new Proxy(
      new Proxy(bound, {
        get(target, key, receiver) {
          if (key !== 'prototype') throw new Error('Unexpected newTarget Get')
          return Reflect.get(target, key, receiver)
        },
        getOwnPropertyDescriptor() {
          throw new Error('Unexpected newTarget descriptor lookup')
        },
        getPrototypeOf() {
          throw new Error('Unexpected newTarget prototype lookup')
        },
        apply() {
          throw new Error('Unexpected newTarget call')
        },
        construct() {
          throw new Error('Unexpected newTarget construction')
        },
      }),
      {}
    )
    Object.defineProperty(bound, 'prototype', {
      get() {
        expect(this).toBe(wrapped)
        events.push('get prototype')
        if (state === 'revoked') pair.revoke()
        return prototype
      },
    })
    if (state === 'revoked' && prototype === null) {
      // ECMA-262 §7.3.24 step 2 follows the bound target after the Get.
      expect(() => Reflect.construct(Temporal.Instant, [0n], wrapped)).toThrow(
        TypeError
      )
    } else {
      const result = Reflect.construct(Temporal.Instant, [0n], wrapped)
      expect(Object.getPrototypeOf(result)).toBe(
        prototype ?? Temporal.Instant.prototype
      )
    }
    expect(events).toEqual(['get prototype'])
  }
)
