import '@formatjs/intl-pluralrules/polyfill'
import {NumberFormat} from '../src/core'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'

const LOCALES = [
  'en',
  'en-GB',
  'da',
  'de',
  'es',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nb',
  'nl',
  'pl',
  'pt',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'zh',
  'en-BS',
]

LOCALES.forEach(locale => {
  require(`@formatjs/intl-pluralrules/locale-data/${locale.split('-')[0]}`)
  NumberFormat.__addLocaleData(require(`./locale-data/${locale}.json`))
})

const SIGN_DISPLAYS: Array<NumberFormatOptions['signDisplay']> = [
  'auto',
  'always',
  'never',
  'exceptZero',
]
const NOTATIONS: Array<NumberFormatOptions['notation']> = [
  'engineering',
  'scientific',
  'compact',
  'standard',
]
const UNIT_DISPLAYS: Array<NumberFormatOptions['unitDisplay']> = [
  'long',
  'short',
  'narrow',
]
const COMPACT_DISPLAYS: Array<NumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
]

function test() {
  LOCALES.forEach(locale => {
    describe(locale, function () {
      describe('unit', function () {
        UNIT_DISPLAYS.forEach(unitDisplay =>
          describe(`unitDisplay/${unitDisplay}`, function () {
            SIGN_DISPLAYS.forEach(signDisplay =>
              describe(`signDisplay/${signDisplay}`, function () {
                NOTATIONS.forEach(notation =>
                  describe(`notation/${notation}`, function () {
                    COMPACT_DISPLAYS.forEach(compactDisplay => {
                      const numberFormatBit = new NumberFormat(locale, {
                        style: 'unit',
                        unit: 'bit',
                        unitDisplay,
                        signDisplay,
                        notation,
                        compactDisplay,
                      })
                      const numberFormatCelsius = new NumberFormat(locale, {
                        style: 'unit',
                        unit: 'celsius',
                        unitDisplay,
                        signDisplay,
                        notation,
                        compactDisplay,
                      })
                      const numberFormatGallon = new NumberFormat(locale, {
                        style: 'unit',
                        unit: 'gallon',
                        unitDisplay,
                        signDisplay,
                        notation,
                        compactDisplay,
                      })
                      it(`compactDisplay/${compactDisplay} formatToParts`, function () {
                        expect(
                          numberFormatBit.formatToParts(10000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatCelsius.formatToParts(10000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatGallon.formatToParts(10000)
                        ).toMatchSnapshot()
                      })

                      it(`compactDisplay/${compactDisplay} formatRange`, function () {
                        expect(
                          numberFormatBit.formatRange(10000, 20000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatCelsius.formatRange(10000, 20000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatGallon.formatRange(10000, 20000)
                        ).toMatchSnapshot()
                      })

                      it(`compactDisplay/${compactDisplay} formatRangeToParts`, function () {
                        expect(
                          numberFormatBit.formatRangeToParts(10000, 20000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatCelsius.formatRangeToParts(10000, 20000)
                        ).toMatchSnapshot()
                        expect(
                          numberFormatGallon.formatRangeToParts(10000, 20000)
                        ).toMatchSnapshot()
                      })
                    })
                  })
                )
              })
            )
          })
        )
      })
    })
  })
}

// Node v8 does not have formatToParts and v12 has native NumberFormat.
describe('NumberFormat', test)
