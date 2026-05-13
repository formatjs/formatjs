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
