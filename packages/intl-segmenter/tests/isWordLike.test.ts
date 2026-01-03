import {Segmenter} from '../src/segmenter.js'
import {describe, expect, it} from 'vitest'

/**
 * Tests for isWordLike property (issue #4370)
 * https://github.com/formatjs/formatjs/issues/4370
 *
 * Per ECMA-402 Intl.Segmenter specification and Unicode UAX #29 (Word Boundaries),
 * the isWordLike property identifies segments that contain word characters
 * (letters, numbers, ideographs) versus segments that are punctuation,
 * whitespace, or symbols.
 *
 * References:
 * - ECMA-402 Intl.Segmenter: https://tc39.es/ecma402/#sec-intl-segmenter-constructor
 * - Unicode UAX #29 (Word Boundaries): https://unicode.org/reports/tr29/#Word_Boundaries
 * - Unicode Word Break Properties: https://unicode.org/reports/tr29/#Table_Word_Break_Property_Values
 *
 * Native implementation comparison:
 * - Chrome/V8 uses ICU4C for word segmentation
 * - Firefox uses ICU4X
 * - This polyfill uses CLDR word break rules
 *
 * All implementations should produce consistent isWordLike values.
 */
describe('isWordLike property', () => {
  const segmenter = new Segmenter('en', {granularity: 'word'})

  it('should reproduce issue #4370 - spaces and punctuation should NOT be word-like', () => {
    // Before the fix, this bug caused almost all segments (spaces, punctuation, etc.)
    // to be incorrectly marked as isWordLike=true, except for newlines.
    // This test demonstrates the exact issue reported in #4370.
    const text = 'Hello, world!'
    const segments = Array.from(segmenter.segment(text))

    // Map segments to their isWordLike values for debugging
    const segmentInfo = segments.map(s => ({
      text: s!.segment,
      isWordLike: s!.isWordLike,
    }))

    // Words should be word-like
    const helloSegment = segmentInfo.find(s => s.text === 'Hello')
    expect(helloSegment).toBeDefined()
    expect(helloSegment!.isWordLike).toBe(true)

    const worldSegment = segmentInfo.find(s => s.text === 'world')
    expect(worldSegment).toBeDefined()
    expect(worldSegment!.isWordLike).toBe(true)

    // Punctuation and spaces should NOT be word-like (this was the bug)
    const commaSegment = segmentInfo.find(s => s.text === ',')
    expect(commaSegment).toBeDefined()
    expect(commaSegment!.isWordLike).toBe(false) // Was incorrectly true before fix

    const spaceSegment = segmentInfo.find(s => s.text === ' ')
    expect(spaceSegment).toBeDefined()
    expect(spaceSegment!.isWordLike).toBe(false) // Was incorrectly true before fix

    const exclamationSegment = segmentInfo.find(s => s.text === '!')
    expect(exclamationSegment).toBeDefined()
    expect(exclamationSegment!.isWordLike).toBe(false) // Was incorrectly true before fix
  })

  it('should mark letter segments as word-like', () => {
    const segments = Array.from(segmenter.segment('Hello'))
    expect(segments).toHaveLength(1)
    expect(segments[0]!.segment).toBe('Hello')
    expect(segments[0]!.isWordLike).toBe(true)
  })

  it('should mark single space as NOT word-like', () => {
    const segments = Array.from(segmenter.segment(' '))
    expect(segments).toHaveLength(1)
    expect(segments[0]!.segment).toBe(' ')
    expect(segments[0]!.isWordLike).toBe(false)
  })

  it('should correctly identify word-like vs non-word-like in "Hello world"', () => {
    const segments = Array.from(segmenter.segment('Hello world'))
    expect(segments).toHaveLength(3)

    expect(segments[0]!.segment).toBe('Hello')
    expect(segments[0]!.isWordLike).toBe(true)

    expect(segments[1]!.segment).toBe(' ')
    expect(segments[1]!.isWordLike).toBe(false)

    expect(segments[2]!.segment).toBe('world')
    expect(segments[2]!.isWordLike).toBe(true)
  })

  it('should mark hyphen/dash as NOT word-like', () => {
    const segments = Array.from(segmenter.segment('Hello-world'))

    const hyphenSegment = segments.find(s => s!.segment === '-')
    expect(hyphenSegment).toBeDefined()
    expect(hyphenSegment!.isWordLike).toBe(false)

    const wordSegments = segments.filter(s => s!.segment !== '-')
    wordSegments.forEach(seg => {
      expect(seg!.isWordLike).toBe(true)
    })
  })

  it('should mark punctuation as NOT word-like', () => {
    const text = 'Hello, world!'
    const segments = Array.from(segmenter.segment(text))

    const commaSegment = segments.find(s => s!.segment === ',')
    expect(commaSegment).toBeDefined()
    expect(commaSegment!.isWordLike).toBe(false)

    const exclamationSegment = segments.find(s => s!.segment === '!')
    expect(exclamationSegment).toBeDefined()
    expect(exclamationSegment!.isWordLike).toBe(false)

    // Word segments should be word-like
    const helloSegment = segments.find(s => s!.segment === 'Hello')
    expect(helloSegment).toBeDefined()
    expect(helloSegment!.isWordLike).toBe(true)

    const worldSegment = segments.find(s => s!.segment === 'world')
    expect(worldSegment).toBeDefined()
    expect(worldSegment!.isWordLike).toBe(true)
  })

  it('should mark newlines as NOT word-like', () => {
    const segments = Array.from(segmenter.segment('Hello\nworld'))

    const newlineSegment = segments.find(s => s!.segment === '\n')
    expect(newlineSegment).toBeDefined()
    expect(newlineSegment!.isWordLike).toBe(false)
  })

  it('should mark numbers as word-like', () => {
    const segments = Array.from(segmenter.segment('test123'))

    // Depending on rules, this might be one segment or multiple
    // But any segment containing digits should be word-like
    const numberSegments = segments.filter(s => /\d/.test(s!.segment))
    expect(numberSegments.length).toBeGreaterThan(0)
    numberSegments.forEach(seg => {
      expect(seg!.isWordLike).toBe(true)
    })
  })

  it('should mark standalone numbers as word-like', () => {
    const segments = Array.from(segmenter.segment('123'))
    expect(segments.length).toBeGreaterThan(0)

    const numSegment = segments.find(s => s!.segment === '123')
    expect(numSegment).toBeDefined()
    expect(numSegment!.isWordLike).toBe(true)
  })

  it('should handle multiple spaces correctly', () => {
    const segments = Array.from(segmenter.segment('word   word'))

    // Find space segments
    const spaceSegments = segments.filter(s => s!.segment.trim() === '')
    spaceSegments.forEach(seg => {
      expect(seg!.isWordLike).toBe(false)
    })

    // Find word segments
    const wordSegments = segments.filter(s => s!.segment.trim() !== '')
    wordSegments.forEach(seg => {
      expect(seg!.isWordLike).toBe(true)
    })
  })

  it('should mark various punctuation as NOT word-like', () => {
    const punctuation = [
      '.',
      ',',
      ';',
      ':',
      '!',
      '?',
      '"',
      "'",
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
    ]

    for (const punct of punctuation) {
      const text = `word${punct}word`
      const segments = Array.from(segmenter.segment(text))

      const punctSegment = segments.find(s => s!.segment === punct)
      if (punctSegment) {
        expect(punctSegment.isWordLike).toBe(false)
      }
    }
  })

  it('should handle apostrophes in contractions', () => {
    const segments = Array.from(segmenter.segment("don't"))

    // Depending on rules, "don't" might be one segment or split
    // If split, the apostrophe itself should be word-like if it's part of a contraction
    // But if it's a standalone segment, it should not be word-like
    segments.forEach(seg => {
      if (seg!.segment === "'") {
        // Standalone apostrophe is not word-like
        expect(seg!.isWordLike).toBe(false)
      } else if (seg!.segment.includes("'")) {
        // Contains apostrophe as part of word - is word-like
        expect(seg!.isWordLike).toBe(true)
      } else {
        // Pure letter segment - is word-like
        expect(seg!.isWordLike).toBe(true)
      }
    })
  })

  it('should handle Unicode characters correctly', () => {
    // Chinese characters
    const chineseSegments = Array.from(segmenter.segment('你好'))
    chineseSegments.forEach(seg => {
      if (/[\p{L}]/u.test(seg!.segment)) {
        expect(seg!.isWordLike).toBe(true)
      }
    })

    // Arabic characters
    const arabicSegments = Array.from(segmenter.segment('مرحبا'))
    arabicSegments.forEach(seg => {
      if (/[\p{L}]/u.test(seg!.segment)) {
        expect(seg!.isWordLike).toBe(true)
      }
    })

    // Cyrillic characters
    const cyrillicSegments = Array.from(segmenter.segment('Привет'))
    cyrillicSegments.forEach(seg => {
      if (/[\p{L}]/u.test(seg!.segment)) {
        expect(seg!.isWordLike).toBe(true)
      }
    })
  })

  it('should handle emoji correctly as NOT word-like', () => {
    const segments = Array.from(segmenter.segment('Hello 😊 world'))

    const emojiSegment = segments.find(s => s!.segment === '😊')
    if (emojiSegment) {
      expect(emojiSegment.isWordLike).toBe(false)
    }
  })

  it('should handle mixed content correctly', () => {
    const text = 'Price: $19.99!'
    const segments = Array.from(segmenter.segment(text))

    // "Price" should be word-like
    const priceSegment = segments.find(s => s!.segment === 'Price')
    expect(priceSegment).toBeDefined()
    expect(priceSegment!.isWordLike).toBe(true)

    // Numbers should be word-like
    const numberSegments = segments.filter(s => /\d+/.test(s!.segment))
    numberSegments.forEach(seg => {
      expect(seg!.isWordLike).toBe(true)
    })

    // Symbols should NOT be word-like
    const dollarSegment = segments.find(s => s!.segment === '$')
    if (dollarSegment) {
      expect(dollarSegment.isWordLike).toBe(false)
    }
  })

  it('should not mark most segments as word-like (regression test for #4370)', () => {
    // This is the core issue: almost everything was marked as word-like
    // Now we should see proper discrimination
    const text = 'Hello, world! Test-case.'
    const segments = Array.from(segmenter.segment(text))

    const wordLikeCount = segments.filter(s => s!.isWordLike).length
    const notWordLikeCount = segments.filter(s => !s!.isWordLike).length

    // We should have a mix of word-like and non-word-like segments
    expect(wordLikeCount).toBeGreaterThan(0)
    expect(notWordLikeCount).toBeGreaterThan(0)

    // Specifically, punctuation and spaces should NOT be word-like
    const punctAndSpaces = segments.filter(s => /^[\s,!.-]+$/.test(s!.segment))
    punctAndSpaces.forEach(seg => {
      expect(seg!.isWordLike).toBe(false)
    })
  })
})
