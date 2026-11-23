import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {expect, it} from 'vitest'

it.each([
  ['', []],
  ['literal', [{type: 'literal', value: 'literal'}]],
  ['{0}', [{type: '0', value: undefined}]],
  ['{literal}', [{type: 'literal', value: undefined}]],
  [
    '{0}{0}',
    [
      {type: '0', value: undefined},
      {type: '0', value: undefined},
    ],
  ],
  [
    'AA{0}BB{field}CC',
    [
      {type: 'literal', value: 'AA'},
      {type: '0', value: undefined},
      {type: 'literal', value: 'BB'},
      {type: 'field', value: undefined},
      {type: 'literal', value: 'CC'},
    ],
  ],
  [
    '\ud800😀{hour}e\u0301\udc00',
    [
      {type: 'literal', value: '\ud800😀'},
      {type: 'hour', value: undefined},
      {type: 'literal', value: 'e\u0301\udc00'},
    ],
  ],
] as const)('partitions %j without empty literals', (pattern, expected) => {
  const actual = PartitionPattern(pattern)
  expect(actual).toEqual(expected)
  expect(actual).not.toBe(PartitionPattern(pattern))
  if (actual.length) {
    expect(actual[0]).not.toBe(PartitionPattern(pattern)[0])
    expect(Object.hasOwn(actual[0], 'type')).toBe(true)
    expect(Object.hasOwn(actual[0], 'value')).toBe(true)
  }
})

it.each([
  'indexOf',
  'substring',
  'push',
  'index setter',
  'type setter',
  'value setter',
  'descriptor getter',
  'Reflect.apply',
])('partitions private patterns without observing %s', hook => {
  const define = Object.defineProperty
  const failure = Object.freeze({message: hook})
  const poison = () => {
    throw failure
  }
  let owner: object, key: PropertyKey, replacement: PropertyDescriptor
  if (
    hook === 'indexOf' ||
    hook === 'substring' ||
    hook === 'push' ||
    hook === 'Reflect.apply'
  ) {
    owner =
      hook === 'Reflect.apply'
        ? Reflect
        : hook === 'push'
          ? Array.prototype
          : String.prototype
    key = hook === 'Reflect.apply' ? 'apply' : hook
    replacement = {
      __proto__: null,
      configurable: true,
      writable: true,
      value: poison,
    } as PropertyDescriptor
  } else {
    owner = hook === 'index setter' ? Array.prototype : Object.prototype
    key =
      hook === 'index setter'
        ? '0'
        : hook === 'type setter'
          ? 'type'
          : hook === 'value setter'
            ? 'value'
            : 'get'
    replacement =
      hook === 'descriptor getter'
        ? ({
            __proto__: null,
            configurable: true,
            get: poison,
          } as PropertyDescriptor)
        : ({
            __proto__: null,
            configurable: true,
            set: poison,
          } as PropertyDescriptor)
  }
  const descriptor = Object.getOwnPropertyDescriptor(owner, key)
  let actual: unknown, error: unknown
  try {
    define(owner, key, replacement)
    actual = PartitionPattern('A{hour}B{minute}C')
  } catch (caught) {
    error = caught
  } finally {
    if (descriptor) define(owner, key, descriptor)
    else Reflect.deleteProperty(owner, key)
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([
    {type: 'literal', value: 'A'},
    {type: 'hour', value: undefined},
    {type: 'literal', value: 'B'},
    {type: 'minute', value: undefined},
    {type: 'literal', value: 'C'},
  ])
})
