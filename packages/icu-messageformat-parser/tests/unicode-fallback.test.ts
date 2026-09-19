import {
  Parser,
  type ParserOptions,
  withIdentifierFallbackForTesting,
} from '#packages/icu-messageformat-parser/parser.js'
import {readFileSync, readdirSync} from 'node:fs'
import {parse} from '#packages/icu-messageformat-parser/index.js'
import {IDENTIFIER_PREFIX_REGEX} from '@formatjs_generated/unicode/icu-messageformat-parser-regex.js'
import {afterEach, expect, it, vi} from 'vitest'

const NativeRegExp = RegExp

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it.each(['throws', 'incorrect match'])(
  'imports and parses when Unicode property matching %s',
  async mode => {
    const messages = [
      'plain text',
      'Hello, {name}!',
      '{数量, plural, =0 {空} one {{𐐀}} other {<b>{имя}</b> #}}',
      '{选择, select, 是 {yes} other {no}}',
      '{a\u0301}',
      '{\ud800}',
      '{\udc00}',
      '{name\u00a0}',
      '{a-b}',
      '{}',
      '{a\u200e}',
    ]
    const result = (parser: typeof parse, message: string) => {
      try {
        return parser(message, {captureLocation: true})
      } catch (error) {
        const {message, location} = error as SyntaxError & {location: unknown}
        return {message, location}
      }
    }
    const expected = messages.map(message => result(parse, message))
    vi.resetModules()
    let probes = 0
    vi.stubGlobal(
      'RegExp',
      new Proxy(NativeRegExp, {
        construct(target, args) {
          if (String(args[0]).includes('\\p{')) {
            probes++
            if (mode === 'throws') {
              throw new SyntaxError('Invalid property name in character class')
            }
            return /()/g
          }
          return Reflect.construct(target, args)
        },
      })
    )
    const fallback = await import('#packages/icu-messageformat-parser/index.js')
    expect(probes).toBeGreaterThan(0)
    expect(messages.map(message => result(fallback.parse, message))).toEqual(
      expected
    )
  }
)

it('matches native Unicode identifier membership for every code point', () => {
  const native = new NativeRegExp(
    '([^\\p{White_Space}\\p{Pattern_Syntax}]*)',
    'uy'
  )
  for (let code = 0; code <= 0x10ffff; code++) {
    const input = `!${String.fromCodePoint(code)}!`
    native.lastIndex = IDENTIFIER_PREFIX_REGEX.lastIndex = 1
    const expected = native.exec(input)?.[1]
    const actual = IDENTIFIER_PREFIX_REGEX.exec(input)?.[1]
    if (actual !== expected) {
      throw new Error(`Identifier mismatch at U+${code.toString(16)}`)
    }
  }
})

const fixtureDirectory = new URL(
  '../integration-tests/test_cases/',
  import.meta.url
)

it.each(readdirSync(fixtureDirectory).sort())(
  'fallback corpus: %s',
  filename => {
    const [message, rawOptions, expected] = readFileSync(
      new URL(filename, fixtureDirectory),
      'utf8'
    ).split('\n---\n')
    const options = JSON.parse(rawOptions)
    if (options.locale) {
      options.locale = new Intl.Locale(options.locale)
    }
    const result = withIdentifierFallbackForTesting(() =>
      new Parser(message, options as ParserOptions).parse()
    )
    expect(result).toEqual(JSON.parse(expected))
  }
)

it('restores the native matcher even when the harness callback throws', () => {
  const fallbackExec = vi.spyOn(IDENTIFIER_PREFIX_REGEX, 'exec')
  try {
    expect(() =>
      withIdentifierFallbackForTesting(() => {
        expect(new Parser('{name}').parse().err).toBeNull()
        throw new Error('test failure')
      })
    ).toThrow('test failure')
    expect(fallbackExec).toHaveBeenCalled()
    fallbackExec.mockClear()
    expect(new Parser('{name}').parse().err).toBeNull()
    expect(fallbackExec).not.toHaveBeenCalled()
  } finally {
    fallbackExec.mockRestore()
  }
})
