import {test, expect} from 'vitest'
import {NumberFormat} from '../src/core'
NumberFormat.__addLocaleData(require(`./locale-data/en.json`))
test('legacy constructor', function () {
  let object = new NumberFormat()
  let newObject = NumberFormat.call(object)

  let symbols = Object.getOwnPropertySymbols(newObject)
  if (symbols.length !== 0) {
    expect(symbols.length).toBe(1)
    // @ts-ignore
    expect(symbols[0].description).toBe('IntlLegacyConstructedSymbol')
  }
})
