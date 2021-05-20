import {generateNumFmtPattern} from '../index'

test.each`
  locale       | result
  ${'en'}      | ${'"$"#,##0.00;-"$"#,##0.00'}
  ${'fr'}      | ${'#\u202f##0,00\xa0"$US";-#\u202f##0,00\xa0"$US"'}
  ${'ko'}      | ${'"US$"#,##0.00;-"US$"#,##0.00'}
  ${'zh-Hant'} | ${'"US$"#,##0.00;-"US$"#,##0.00'}
  ${'zh-Hans'} | ${'"US$"#,##0.00;-"US$"#,##0.00'}
  ${'ja'}      | ${'"$"#,##0.00;-"$"#,##0.00'}
`('format USD in $locale to pattern $result', function ({locale, result}) {
  expect(
    generateNumFmtPattern(locale, {
      style: 'currency',
      currency: 'USD',
    })
  ).toBe(result)
})

test.each`
  locale       | result
  ${'en'}      | ${'"₩"#,##0;-"₩"#,##0'}
  ${'fr'}      | ${'#\u202f##0\xa0"₩";-#\u202f##0\xa0"₩"'}
  ${'ko'}      | ${'"₩"#,##0;-"₩"#,##0'}
  ${'zh-Hant'} | ${'"￦"#,##0;-"￦"#,##0'}
  ${'zh-Hans'} | ${'"￦"#,##0;-"￦"#,##0'}
  ${'ja'}      | ${'"₩"#,##0;-"₩"#,##0'}
`('format KRW in $locale to pattern $result', function ({locale, result}) {
  expect(
    generateNumFmtPattern(locale, {
      style: 'currency',
      currency: 'KRW',
    })
  ).toBe(result)
})

test.each`
  locale       | result
  ${'en'}      | ${'"BHD"\xa0#,##0.000;-"BHD"\xa0#,##0.000'}
  ${'fr'}      | ${'#\u202f##0,000\xa0"BHD";-#\u202f##0,000\xa0"BHD"'}
  ${'ko'}      | ${'"BHD"\xa0#,##0.000;-"BHD"\xa0#,##0.000'}
  ${'zh-Hant'} | ${'"BHD"\xa0#,##0.000;-"BHD"\xa0#,##0.000'}
  ${'zh-Hans'} | ${'"BHD"\xa0#,##0.000;-"BHD"\xa0#,##0.000'}
  ${'ja'}      | ${'"BHD"\xa0#,##0.000;-"BHD"\xa0#,##0.000'}
`('format BHD in $locale to pattern $result', function ({locale, result}) {
  expect(
    generateNumFmtPattern(locale, {
      style: 'currency',
      currency: 'BHD',
    })
  ).toBe(result)
})
test.each`
  locale       | result
  ${'en'}      | ${'"CLF"\xa0#,##0.0000;-"CLF"\xa0#,##0.0000'}
  ${'fr'}      | ${'#\u202f##0,0000\xa0"CLF";-#\u202f##0,0000\xa0"CLF"'}
  ${'ko'}      | ${'"CLF"\xa0#,##0.0000;-"CLF"\xa0#,##0.0000'}
  ${'zh-Hant'} | ${'"CLF"\xa0#,##0.0000;-"CLF"\xa0#,##0.0000'}
  ${'zh-Hans'} | ${'"CLF"\xa0#,##0.0000;-"CLF"\xa0#,##0.0000'}
  ${'ja'}      | ${'"CLF"\xa0#,##0.0000;-"CLF"\xa0#,##0.0000'}
`('format CLF in $locale to pattern $result', function ({locale, result}) {
  expect(
    generateNumFmtPattern(locale, {
      style: 'currency',
      currency: 'CLF',
    })
  ).toBe(result)
})

test('format currency accounting', function () {
  expect(
    generateNumFmtPattern('en', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
    })
  ).toBe('"$"#,##0.00;("$"#,##0.00)')
})
