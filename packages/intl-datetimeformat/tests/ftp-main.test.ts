import * as en from './locale-data/en.json'
import * as pl from './locale-data/pl.json'
import * as de from './locale-data/de.json'
import * as ar from './locale-data/ar.json'
import allData from '../src/data/all-tz'
import {DateTimeFormat} from '../src/core'
import {IntlDateTimeFormatPart} from '@formatjs/ecma402-abstract'
// @ts-ignore
DateTimeFormat.__addLocaleData(en, pl, de, ar)
DateTimeFormat.__addTZData(allData)
function reduce(parts: IntlDateTimeFormatPart[]) {
  return parts.map(part => part.value).join('')
}

function compareFTPtoFormat(
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
  value?: number
) {
  const dtf = new DateTimeFormat(locales, options)
  it(`Expected the same value for value ${value},
  locales: ${locales} and options: ${options}`, function () {
    expect(dtf.format(value)).toBe(reduce(dtf.formatToParts(value)))
  })
}

describe('formatToParts-main', function () {
  compareFTPtoFormat()
  compareFTPtoFormat('pl')
  compareFTPtoFormat(['pl'])
  compareFTPtoFormat([])
  compareFTPtoFormat(['de'], undefined, 0)
  compareFTPtoFormat(['de'], undefined, -10)
  compareFTPtoFormat(['de'], undefined, 25324234235)
  compareFTPtoFormat(
    ['de'],
    {
      day: '2-digit',
    },
    Date.now()
  )
  compareFTPtoFormat(
    ['de'],
    {
      day: 'numeric',
      year: '2-digit',
    },
    Date.now()
  )
  compareFTPtoFormat(
    ['ar'],
    {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    },
    Date.now()
  )

  it('actualPartTypes', function () {
    const actualPartTypes = new DateTimeFormat('en-us', {
      weekday: 'long',
      era: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: 'UTC',
      timeZoneName: 'long',
    })
      .formatToParts(Date.UTC(2012, 11, 17, 3, 0, 42))
      .map(part => part.type)

    const legalPartTypes = [
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'literal',
      'dayPeriod',
      'timeZoneName',
    ]

    actualPartTypes.forEach(function (type) {
      expect(legalPartTypes).toContain(type)
    })
  })
})
