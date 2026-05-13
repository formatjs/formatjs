import {describe, expect, it} from 'vitest'
import {
  buildUCATrie,
  parseCollationElement,
  parseCodePointSequence,
  parseUCA,
  parseUCALine,
} from '#packages/intl-collator/scripts/parse-uca.js'

describe('UCA parser', () => {
  it('parses code point sequences', () => {
    expect(parseCodePointSequence('0063 0068')).toEqual([0x63, 0x68])
  })

  it('parses collation element weights', () => {
    expect(parseCollationElement('.1C47.0020.0002')).toEqual({
      primary: 0x1c47,
      secondary: 0x20,
      tertiary: 0x2,
      quaternary: 0,
      variable: false,
    })
  })

  it('marks variable collation elements', () => {
    expect(parseCollationElement('*0209.0020.0002')).toMatchObject({
      primary: 0x209,
      secondary: 0x20,
      tertiary: 0x2,
      variable: true,
    })
  })

  it('parses CLDR fractional collation element weights', () => {
    expect(parseCollationElement('03 02 02, 05, 05')).toEqual({
      primary: 0x030202,
      secondary: 0x05,
      tertiary: 0x05,
      quaternary: 0,
      variable: false,
    })
  })

  it('parses completely ignorable collation elements', () => {
    expect(parseCollationElement(',,')).toEqual({
      primary: 0,
      secondary: 0,
      tertiary: 0,
      quaternary: 0,
      variable: false,
    })
  })

  it('parses code point references in fractional weights', () => {
    expect(parseCollationElement('U+4E00, 10')).toMatchObject({
      primary: 0x4e00,
      secondary: 0x10,
    })
    expect(parseCollationElement('U+4E0D')).toMatchObject({
      primary: 0x4e0d,
    })
  })

  it('parses UCA data lines', () => {
    expect(
      parseUCALine(
        '0061 ; [.1C47.0020.0002] # LATIN SMALL LETTER A'
      )
    ).toEqual({
      codePoints: [0x61],
      elements: [
        {
          primary: 0x1c47,
          secondary: 0x20,
          tertiary: 0x2,
          quaternary: 0,
          variable: false,
        },
      ],
      comment: 'LATIN SMALL LETTER A',
    })
  })

  it('parses prefixed UCA data lines by indexing the target sequence', () => {
    expect(parseUCALine('004C | 00B7; [, FB B6, 05]')).toMatchObject({
      codePoints: [0x00b7],
      elements: [
        {
          primary: 0,
          secondary: 0xfbb6,
          tertiary: 0x05,
        },
      ],
    })
  })

  it('skips comments and settings', () => {
    expect(
      parseUCA(`
# comment
@version 48
0061 ; [.1C47.0020.0002] # LATIN SMALL LETTER A
`)
    ).toHaveLength(1)
  })

  it('builds a longest-match trie', () => {
    const entries = parseUCA(`
0063 ; [.1C50.0020.0002] # LATIN SMALL LETTER C
0063 0068 ; [.1D00.0020.0002] # CH contraction
`)
    expect(buildUCATrie(entries)).toMatchObject({
      next: {
        [0x63]: {
          value: 0,
          next: {
            [0x68]: {
              value: 1,
            },
          },
        },
      },
    })
  })
})
