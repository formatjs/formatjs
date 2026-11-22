import {expect, test} from 'vitest'
import {memoize, strategies} from '#packages/fast-memoize/index.js'

test('custom variadic serializer receives an ordinary argument Array', () => {
  const seen: unknown[][] = []
  const first = {key: 'same', value: 'first'}
  const second = {key: 'same', value: 'second'}
  const format = memoize(
    (value: typeof first, suffix: string) => ({value, suffix}),
    {
      strategy: strategies.variadic,
      serializer(args) {
        expect(Object.getPrototypeOf(args)).toBe(Array.prototype)
        expect([...args]).toEqual(args.slice())
        seen.push(args)
        return args
          .map(value => (typeof value === 'string' ? value : value.key))
          .join(':')
      },
    }
  )
  const result = format(first, '!')
  expect(result).toEqual({value: first, suffix: '!'})
  expect(result.value).toBe(first)
  expect(format(second, '!')).toBe(result)
  expect(seen).toEqual([
    [first, '!'],
    [second, '!'],
  ])
})

for (const strategy of ['monadic', 'variadic'] as const) {
  test(`${strategy} preserves own object toJSON and original argument identity`, () => {
    const seen: {receiver: unknown; key: string}[] = []
    const makeValue = (label: string) => ({
      label,
      toJSON(key: string) {
        seen.push({receiver: this, key})
        return 'shared-key'
      },
    })
    const first = makeValue('first')
    const second = makeValue('second')
    const format = memoize((value: typeof first) => ({value}), {
      strategy: strategies[strategy],
    })
    const result = format(first)
    expect(result.value).toBe(first)
    expect(format(second)).toBe(result)
    expect(seen).toEqual([
      {receiver: first, key: '0'},
      {receiver: second, key: '0'},
    ])
    expect(Object.getPrototypeOf(first)).toBe(Object.prototype)
  })

  test(`${strategy} preserves inherited Array toJSON`, () => {
    const seen: unknown[] = []
    class Values extends Array<string> {
      toJSON() {
        seen.push(this)
        return ['shared-key']
      }
    }
    const first = new Values('first')
    const second = new Values('second')
    const format = memoize((value: Values) => ({value}), {
      strategy: strategies[strategy],
    })
    const result = format(first)
    expect(result.value).toBe(first)
    expect(format(second)).toBe(result)
    expect(seen).toEqual([first, second])
    expect(Object.getPrototypeOf(first)).toBe(Values.prototype)
    expect(first.slice()).toEqual(new Values('first'))
  })
}

test('variadic calls preserve argument count, undefined and object identity', () => {
  const value = {label: 'original'}
  const format = memoize(
    function (...args: unknown[]) {
      return {args, count: arguments.length}
    },
    {strategy: strategies.variadic}
  )
  expect(format()).toEqual({args: [], count: 0})
  expect(format(undefined)).toEqual({args: [undefined], count: 1})
  const result = format(value, undefined, 3)
  expect(result).toEqual({args: [value, undefined, 3], count: 3})
  expect(result.args[0]).toBe(value)
})
