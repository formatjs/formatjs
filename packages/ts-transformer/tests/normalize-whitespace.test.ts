import {normalizeMessageWhitespace} from '#packages/ts-transformer/normalize-whitespace'
import {describe, expect, test} from 'vitest'

describe('normalizeMessageWhitespace', () => {
  test('normalizes Unicode White_Space', () => {
    expect(
      normalizeMessageWhitespace(
        '\u0009A\u0085\u2002\u2003B\u00a0C\u2028D\u3000'
      )
    ).toBe('A B C D')
  })

  test('does not normalize non-White_Space format characters', () => {
    expect(normalizeMessageWhitespace('\ufeffA\ufeffB\ufeff')).toBe(
      '\ufeffA\ufeffB\ufeff'
    )
  })
})
