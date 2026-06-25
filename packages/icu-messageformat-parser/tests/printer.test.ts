import {parse} from '#packages/icu-messageformat-parser/index.js'
import {printAST} from '#packages/icu-messageformat-parser/printer.js'
import {TYPE} from '#packages/icu-messageformat-parser/types.js'
import {expect, test} from 'vitest'

test('parses plain top-level messages without changing AST shape', function () {
  expect(parse('Hello world')).toEqual([
    {
      type: TYPE.literal,
      value: 'Hello world',
    },
  ])
  expect(parse('')).toEqual([])
})

test('preserves plain top-level message location when requested', function () {
  expect(parse('Hello world', {captureLocation: true})).toEqual([
    {
      type: TYPE.literal,
      value: 'Hello world',
      location: {
        start: {offset: 0, line: 1, column: 1},
        end: {offset: 11, line: 1, column: 12},
      },
    },
  ])
})

test('tracks plain top-level message location across surrogate pairs', function () {
  expect(parse('Hi 🌎', {captureLocation: true})).toEqual([
    {
      type: TYPE.literal,
      value: 'Hi 🌎',
      location: {
        start: {offset: 0, line: 1, column: 1},
        end: {offset: 5, line: 1, column: 5},
      },
    },
  ])
})

test('should escape things properly', function () {
  expect(printAST(parse("Name: ''{name}''."))).toBe("Name: ''{name}''.")
  expect(printAST(parse("'just some {name} thing'"))).toBe(
    "'just some {name} thing'"
  )
  expect(
    printAST(
      parse(
        "Peter's brother {name1} is taller than {name} who is Peter's friend."
      )
    )
  ).toBe("Peter's brother {name1} is taller than {name} who is Peter's friend.")
})

test('escapes tag-like literal text so printed messages can be parsed again', function () {
  const input =
    "The URL is defined as '<Issuer URL>'/.well-known/openid-configuration."
  const output = printAST(parse(input))

  expect(output).toBe(
    "The URL is defined as '<Issuer URL>'/.well-known/openid-configuration."
  )
  expect(parse(output)).toEqual(parse(input))
})

test('doubles apostrophes inside quoted literal syntax', function () {
  const input = "This '{isn''t}' obvious and '<Bob''s URL>' works."
  const output = printAST(parse(input))

  expect(output).toBe("This '{isn''t}' obvious and '<Bob''s URL>' works.")
  expect(parse(output)).toEqual(parse(input))
})

test('escapes tag syntax delimiters independently', function () {
  const input = "This is '<b>HTML</b>' and '<i>XML</i>'."
  const output = printAST(parse(input))

  expect(output).toBe("This is '<b>'HTML'</b>' and '<i>'XML'</i>'.")
  expect(parse(output)).toEqual(parse(input))
})

test('escapes pound signs inside plural literals', function () {
  const input = "{count, plural, one {'# item'} other {'# items'}}"
  const output = printAST(parse(input))

  expect(output).toBe("{count,plural,one{'#' item} other{'#' items}}")
  expect(parse(output)).toEqual(parse(input))
})

// printAST must emit plural/select branches in a deterministic, source-order-
// independent order so that auto-generated message ids match the Rust extractor
// (formatjs_cli) regardless of how branches were authored. See printer.rs:
// plural -> LDML order (zero, one, two, few, many, other) then =N ascending;
// select -> keys sorted alphabetically.
test('sorts plural branches in LDML order with exact matches last', function () {
  expect(
    printAST(
      parse('{count, plural, =0 {No items} one {# item} other {# items}}')
    )
  ).toBe('{count,plural,one{# item} other{# items} =0{No items}}')
})

test('sorts every plural category in LDML order then =N numerically', function () {
  const input =
    '{n, plural, other {O} =5 {F5} many {M} =0 {Z0} few {W} two {T} one {N1} zero {ZZ} =2 {E2}}'
  expect(printAST(parse(input))).toBe(
    '{n,plural,zero{ZZ} one{N1} two{T} few{W} many{M} other{O} =0{Z0} =2{E2} =5{F5}}'
  )
})

test('sorts selectordinal branches in LDML order too', function () {
  expect(
    printAST(
      parse('{n, selectordinal, other {#th} one {#st} two {#nd} few {#rd}}')
    )
  ).toBe('{n,selectordinal,one{#st} two{#nd} few{#rd} other{#th}}')
})

test('sorts select branches alphabetically by key', function () {
  expect(
    printAST(parse('{gender, select, male {He} female {She} other {They}}'))
  ).toBe('{gender,select,female{She} male{He} other{They}}')
})

test('sorts select branches by Unicode code point order', function () {
  const privateUse = '\uE000'
  const astral = '\u{10000}'

  expect(
    printAST(
      parse(
        `{kind, select, ${astral} {Astral} ${privateUse} {Private} other {Other}}`
      )
    )
  ).toBe(`{kind,select,other{Other} ${privateUse}{Private} ${astral}{Astral}}`)
})

test('branch order does not affect printed output (id stability)', function () {
  const a = '{count, plural, =0 {none} one {one} other {many}}'
  const b = '{count, plural, other {many} one {one} =0 {none}}'
  expect(printAST(parse(a))).toBe(printAST(parse(b)))
})
