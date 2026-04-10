import * as noParser from '#packages/icu-messageformat-parser/no-parser.js'
import * as withParser from '#packages/icu-messageformat-parser/index.js'
import {test, expect} from 'vitest'
test('no-parser should export everything that index does', function () {
  expect(Object.keys(noParser)).toEqual(Object.keys(withParser))
})
