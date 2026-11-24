import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {segmentationTests} from '#packages/intl-segmenter/tests/test-utils.js'
import {describe, expect, it} from 'vitest'
const ucdTests = segmentationTests.grapheme

it('constructs segmenters without changing RegExp match state', () => {
  for (const granularity of ['grapheme', 'word', 'sentence'] as const) {
    void /probe(.)/.exec('probe!')
    const segmenter = new Segmenter('en', {granularity})
    const match = RegExp.lastMatch
    const capture = RegExp.$1
    expect(segmenter.resolvedOptions().granularity).toBe(granularity)
    expect([match, capture]).toEqual(['probe!', '!'])
  }
})

describe('Granularity grapheme', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'grapheme',
  })
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test grapheme #%#: '%s', input '%s'`,
    (_, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result!.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})

it('pairs flags after a non-RI code point with a matching low surrogate', () => {
  const segments = new Segmenter('en').segment('🗦🇺🇸🇨🇦')
  const records = Array.from(segments)
  expect(records.map(({segment}) => segment)).toEqual(['🗦', '🇺🇸', '🇨🇦'])
  expect(segments.containing(4)).toEqual(records[1])
})

it('keeps iterator progress and creates independent iterators', () => {
  const segments = new Segmenter('en', {granularity: 'grapheme'}).segment('abc')
  const iterator = segments[Symbol.iterator]()
  expect(iterator[Symbol.iterator]()).toBe(iterator)
  expect(iterator.next().value?.segment).toBe('a')
  expect(Array.from(iterator, item => item.segment)).toEqual(['b', 'c'])
  expect(iterator.next()).toEqual({done: true, value: undefined})
  expect(Array.from(iterator)).toEqual([])
  expect(Array.from(segments, item => item.segment)).toEqual(['a', 'b', 'c'])
  expect(Array.from(segments, item => item.segment)).toEqual(['a', 'b', 'c'])
  expect(segments.containing(1)?.segment).toBe('b')
  expect('next' in segments).toBe(false)
  expect(Object.prototype.toString.call(iterator)).toBe(
    '[object Segmenter String Iterator]'
  )
  const iteratorPrototype = Object.getPrototypeOf(
    Object.getPrototypeOf([][Symbol.iterator]())
  )
  expect(Object.getPrototypeOf(Object.getPrototypeOf(iterator))).toBe(
    iteratorPrototype
  )
})
it('uses the loaded host locale for default and unsupported requests', () => {
  const hostLocale = new Intl.NumberFormat().resolvedOptions().locale
  const expectedLocale = new Segmenter(hostLocale, {
    localeMatcher: 'lookup',
  }).resolvedOptions().locale
  for (const locales of [undefined, 'zxx']) {
    const segmenter = new Segmenter(locales, {
      granularity: 'grapheme',
      localeMatcher: 'lookup',
    })
    expect(segmenter.resolvedOptions().locale).toBe(expectedLocale)
    expect(Array.from(segmenter.segment('ab'), item => item.segment)).toEqual([
      'a',
      'b',
    ])
  }
  expect(Segmenter.supportedLocalesOf('en')).toEqual(['en'])
})

it('resolves the locale before running the granularity getter', () => {
  const availableLocales = Segmenter.availableLocales
  try {
    Segmenter.availableLocales = new Set(['en', 'fr'])
    const formatter = new Segmenter('fr', {
      localeMatcher: 'lookup',
      get granularity() {
        Segmenter.availableLocales = new Set(['en'])
        return 'word' as const
      },
    })
    expect(formatter.resolvedOptions()).toEqual({
      locale: 'fr',
      granularity: 'word',
    })
  } finally {
    Segmenter.availableLocales = availableLocales
  }
})

it('rounds containing indices without calling mutable Math.floor', () => {
  const segments = new Segmenter('en').segment('ab')
  const floor = Math.floor
  let result: string | undefined
  try {
    Math.floor = () => {
      throw new Error('called public Math.floor')
    }
    result = segments.containing(1.9)?.segment
  } finally {
    Math.floor = floor
  }
  expect(result).toBe('b')
})

it.each([
  BigInt(0),
  Object(BigInt(0)),
  {valueOf: () => BigInt(0)},
  {[Symbol.toPrimitive]: () => BigInt(0)},
])('rejects BigInt indices after coercion: %s', index => {
  const segments = new Segmenter('en', {}).segment('ab')
  expect(() => segments.containing(index as number)).toThrow(TypeError)
})

it('coerces containing indices once with the number hint', () => {
  const hints: string[] = []
  const index = {
    [Symbol.toPrimitive](hint: string) {
      hints.push(hint)
      return 1.9
    },
  }
  const segments = new Segmenter('en', {}).segment('ab')
  expect(segments.containing(index as unknown as number)?.segment).toBe('b')
  expect(hints).toEqual(['number'])
})

it('preserves errors thrown while coercing containing indices', () => {
  const error = new Error('coercion')
  const index = {
    valueOf() {
      throw error
    },
  }
  const segments = new Segmenter('en', {}).segment('ab')
  expect.assertions(1)
  try {
    segments.containing(index as unknown as number)
  } catch (caught) {
    expect(caught).toBe(error)
  }
})

it.each([
  [undefined, 'a'],
  [NaN, 'a'],
  [-0, 'a'],
  [-0.5, 'a'],
  ['1.9', 'b'],
  [Infinity, undefined],
  [-Infinity, undefined],
])('handles containing index %s', (index, expected) => {
  const segments = new Segmenter('en', {}).segment('ab')
  expect(segments.containing(index as number)?.segment).toBe(expected)
})

it('uses its intrinsic prototype for a same-realm primitive NewTarget prototype', () => {
  const newTarget = function () {}
  Object.defineProperty(newTarget, 'prototype', {value: null})
  const instance = Reflect.construct(Segmenter, ['en'], newTarget)
  expect(Object.getPrototypeOf(instance)).toBe(Segmenter.prototype)
  expect(instance.resolvedOptions().granularity).toBe('grapheme')
})
