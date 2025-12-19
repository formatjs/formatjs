import {describe, it, expect} from 'vitest'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en'
import * as en from './locale-data/en.json' with {type: 'json'}
import {NumberFormat} from '../src/core'
NumberFormat.__addLocaleData(en as any)
const toNumberResults = [
  [undefined, NaN],
  [null, +0],
  [true, 1],
  [false, +0],
  ['42', 42],
  ['foo', NaN],
]

describe('value-tonumber', function () {
  const nf = new NumberFormat()
  for (const [val1, val2] of toNumberResults) {
    it(`${val1} === ${val2}`, function () {
      expect(nf.formatToParts(val1 as number)).toEqual(
        nf.formatToParts(val2 as number)
      )
    })
  }
})
