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
