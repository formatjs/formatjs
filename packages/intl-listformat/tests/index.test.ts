import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import ListFormat from '#packages/intl-listformat/index.js'
import en from '#packages/intl-listformat/tests/locale-data/en.json' with {type: 'json'}
import enAI from '#packages/intl-listformat/tests/locale-data/en-AI.json' with {type: 'json'}
import zh from '#packages/intl-listformat/tests/locale-data/zh.json' with {type: 'json'}
import zhHant from '#packages/intl-listformat/tests/locale-data/zh-Hant.json' with {type: 'json'}
import zhHans from '#packages/intl-listformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it} from 'vitest'
ListFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant)

describe('Intl.ListFormat', function () {
  it('should support aliases', function () {
    expect(
      new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('123')
    expect(new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2'])).toBe(
      '12'
    )
    expect(
      new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('1 2 3')
    expect(new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2'])).toBe(
      '1 2'
    )
  })
  it('should resolve parent correctly', function () {
    expect(new ListFormat('en-AI').format(['1', '2'])).toBe('1 and 2')
    // Node 12 has an old version of CLDR
    if (process.version && process.version.startsWith('v10')) {
      expect(new ListFormat('en-AI').format(['1', '2', '3'])).toBe('1, 2 and 3')
    }
  })
  it('should normalize case correctly', function () {
    const lf = new ListFormat('en-ai', {style: 'short', type: 'unit'})
    expect(lf.resolvedOptions()).toEqual({
      locale: 'en-AI',
      type: 'unit',
      style: 'short',
    })
  })
})

describe('StringListFromIterable', () => {
  for (const method of ['format', 'formatToParts'] as const) {
    it(`${method} accepts strings and rejects non-iterables`, () => {
      const formatter = new ListFormat('en')
      expect(formatter[method]('ab')).toEqual(formatter[method](['a', 'b']))
      expect(formatter[method](undefined as any)).toEqual(formatter[method]([]))
      for (const value of [1, true, null, {}, Symbol('list')]) {
        expect(() => formatter[method](value as any)).toThrow(TypeError)
      }
    })
    it(`${method} closes the iterator without coercing invalid values`, () => {
      let closed = false
      function* values() {
        try {
          yield {
            toString() {
              throw new Error('must not coerce')
            },
          }
        } finally {
          closed = true
        }
      }
      expect(() => new ListFormat('en')[method](values() as any)).toThrow(
        TypeError
      )
      expect(closed).toBe(true)
    })
    it(`${method} reads each iterator value once`, () => {
      let reads = 0
      const iterable = {
        [Symbol.iterator]() {
          let done = false
          return {
            next(): IteratorResult<string> {
              if (done) return {done: true, value: undefined}
              done = true
              return {
                done: false,
                get value() {
                  reads++
                  return 'a'
                },
              }
            },
          }
        },
      }
      new ListFormat('en')[method](iterable)
      expect(reads).toBe(1)
    })
  }
})
