import * as noParser from '../no-parser'
import * as withParser from '..'
test('no-parser should export everything that index does', function () {
  expect(Object.keys(noParser)).toEqual(Object.keys(withParser))
})
