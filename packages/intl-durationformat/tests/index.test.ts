import {DurationFormat} from '../src/core'
DurationFormat.__addLocaleData({
  data: {
    digitalFormat: {
      latn: ':',
    },
    nu: ['latn'],
  },
  locale: 'en',
})
test.skip('Intl.DurationFormat', function () {
  expect(new DurationFormat('en').format({years: 1})).toBe('1 year')
})
