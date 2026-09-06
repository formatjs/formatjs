import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {segmentationTests} from '#packages/intl-segmenter/tests/test-utils.js'
import {describe, expect, it} from 'vitest'
const ucdTests = segmentationTests.grapheme
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
it('resolves a valid locale for default and unsupported requests', () => {
  for (const locales of [undefined, 'zxx']) {
    const segmenter = new Segmenter(locales, {granularity: 'grapheme'})
    expect(segmenter.resolvedOptions().locale).toBe('en')
    expect(Array.from(segmenter.segment('ab'), item => item.segment)).toEqual([
      'a',
      'b',
    ])
  }
  expect(Segmenter.supportedLocalesOf('en')).toEqual(['en'])
})
