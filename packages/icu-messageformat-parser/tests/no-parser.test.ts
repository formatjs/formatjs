import * as noParser from '../no-parser.js'
import * as withParser from '../index.js'
import {test, expect} from 'vitest'
test('no-parser should export everything that index does', function () {
  expect(Object.keys(noParser)).toEqual(Object.keys(withParser))
})
