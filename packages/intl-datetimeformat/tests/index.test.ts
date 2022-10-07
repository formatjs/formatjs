import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import {DateTimeFormat} from '../src/core'
import * as en from './locale-data/en.json'
import * as enGB from './locale-data/en-GB.json'
import * as enCA from './locale-data/en-CA.json'
import * as zhHans from './locale-data/zh-Hans.json'
import * as fa from './locale-data/fa.json'
import allData from '../src/data/all-tz'

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, enCA, zhHans, fa)
DateTimeFormat.__addTZData(allData)
describe('Intl.DateTimeFormat', function () {
  it('smoke test EST', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'America/New_York',
      }).format(new Date(0))
    ).toBe('12/31/1969, 7:00:00 PM Eastern Standard Time')
  })
  it('en-GB default resolvedOptions, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).resolvedOptions()
    ).toEqual({
      calendar: 'gregory',
      day: '2-digit',
      locale: 'en-GB',
      month: '2-digit',
      numberingSystem: 'latn',
      timeZone: 'UTC',
      year: 'numeric',
    })
  })
  it('en-GB default format, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).format(new Date(0))
    ).toBe('01/01/1970')
  })
  it('smoke test CST', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
  })
  it('CST w/ undefined TZ', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
    process.env.TZ = TZ
  })
  it('smoke test for #1915', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    expect(
      new DateTimeFormat('zh-Hans', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date(0))
    ).toBe('1月1日星期四')
    process.env.TZ = TZ
  })
  it('test for GH issue #1915', function () {
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('8:00 AM')
  })
  it('setDefaultTimeZone should work', function () {
    const defaultTimeZone = DateTimeFormat.getDefaultTimeZone()
    DateTimeFormat.__setDefaultTimeZone('Asia/Shanghai')
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('8:00 AM')
    DateTimeFormat.__setDefaultTimeZone(defaultTimeZone)
  })
  it('diff tz should yield different result', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    const now = new Date()
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(now)
    ).not.toBe(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(now)
    )
    process.env.TZ = TZ
  })
  it('month: long', function () {
    expect(
      new DateTimeFormat('en', {
        month: 'long',
      }).format(new Date(0))
    ).toBe('January')
  })
  it('negative ts', function () {
    expect(
      new DateTimeFormat('en', {weekday: 'short', timeZone: 'UTC'}).format(
        new Date(1899, 1, 1)
      )
    ).toBe('Wed')
  })
  it('test #2106', function () {
    expect(
      new DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam',
      }).format(new Date('2020-09-16T11:55:32.491+02:00'))
    ).toBe('11:55 AM')
  })
  it.skip('test #2145', function () {
    expect(
      new DateTimeFormat('fa', {
        month: 'long',
        year: '2-digit',
        day: '2-digit',
      }).format(new Date('2020-09-16T11:55:32.491+02:00'))
    ).toBe('۲۶ شهریور ۹۹')
  })
  it('test #2145', function () {
    expect(() =>
      new DateTimeFormat('fa', {
        month: 'long',
        year: '2-digit',
        day: '2-digit',
      }).format(new Date('2020-09-16T11:55:32.491+02:00'))
    ).toThrowError(
      new RangeError(
        'Calendar "persian" is not supported. Try setting "calendar" to 1 of the following: gregory'
      )
    )
  })
  it('test #2192', function () {
    expect(
      new DateTimeFormat('en', {
        calendar: 'gregory',
        numberingSystem: 'latn',
        timeZone: 'Africa/Johannesburg', // UTC+2
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(Date.UTC(2020, 0, 1, 12, 0, 0))
    ).toBe('1/1/2020, 2:00:00 PM')
  })
  it('test #2170', function () {
    const formatter = new DateTimeFormat('en-GB', {
      calendar: 'gregory',
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Europe/Berlin',
    })
    expect(formatter.format(new Date('2019-03-31T00:59:59.999Z'))).toBe('01')
    expect(formatter.format(new Date('2019-03-31T01:00:00.000Z'))).toBe('03')
    expect(formatter.format(new Date('2019-03-31T01:00:00.001Z'))).toBe('03')

    expect(formatter.format(new Date('2019-10-27T00:59:59.999Z'))).toBe('02')
    expect(formatter.format(new Date('2019-10-27T01:00:00.000Z'))).toBe('02')
    expect(formatter.format(new Date('2019-10-27T01:00:00.001Z'))).toBe('02')
  })
  it('test #2236', function () {
    const date = new Date('2020-09-16T11:55:32.491+02:00')
    const formatter = new DateTimeFormat('en-US', {
      year: undefined,
      month: undefined,
      day: undefined,
      hour: '2-digit',
      minute: '2-digit',
      second: undefined,
      timeZoneName: 'short',
      timeZone: 'Europe/Amsterdam',
    })
    expect(formatter.format(date)).toBe('11:55 AM GMT+2')
  })
  it('test #2291', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Asia/Kuala_Lumpur',
    })
    expect(dtf.format(date)).toBe('2020年2月01日 下午06:10:10')
  })

  describe('Basic matcher', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)

    describe('timeZoneName', () => {
      const timezoneTests = [
        {
          timeZoneName: 'long',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+08:00',
            'zh-Hans': '2020年2月月1日 GMT+08:00 06:10:10',
          },
        },
        {
          timeZoneName: 'short',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+8',
            'zh-Hans': '2020年2月月1日 GMT+8 06:10:10',
          },
        },
        {
          timeZoneName: 'longGeneric',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+08:00',
            'zh-Hans': '2020年2月月1日 GMT+08:00 06:10:10',
          },
        },
        {
          timeZoneName: 'shortGeneric',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+08:00',
            'zh-Hans': '2020年2月月1日 GMT+08:00 06:10:10',
          },
        },
        {
          timeZoneName: 'longOffset',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+08:00',
            'zh-Hans': '2020年2月月1日 GMT+08:00 06:10:10',
          },
        },
        {
          timeZoneName: 'shortOffset',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+08:00',
            'zh-Hans': '2020年2月月1日 GMT+08:00 06:10:10',
          },
        },
      ]

      timezoneTests.forEach(({timeZoneName, results}) => {
        describe(`timeZoneName ${timeZoneName}`, () => {
          Object.keys(results).forEach(locale => {
            it(`locale ${locale}`, () => {
              const dtf = new DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                hourCycle: 'h12',
                localeMatcher: 'lookup',
                timeZone: 'Asia/Kuala_Lumpur',
                formatMatcher: 'basic',
                // @ts-ignore
                timeZoneName,
              })
              // @ts-ignore
              expect(dtf.format(date)).toBe(results[locale])
            })
          })
        })
      })
    })
  })

  it('test #2609, should handle Etc/GMT-14 short', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Etc/GMT-14',
      timeZoneName: 'short',
    })
    expect(dtf.format(date)).toContain(' GMT+14 ')
  })
  it('test #2609, should handle Etc/GMT-14 long', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Etc/GMT-14',
      timeZoneName: 'long',
    })
    expect(dtf.format(date)).toContain(' GMT+14:00 ')
  })
  it('range with ymdhM', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00 AM – 6/19/2021, 1:00 PM'
    )
  })
  it('GH issue #2909', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(() => dtf.formatRange(date1, date2)).not.toThrow()
  })
  it('GH issue #2951', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Etc/UTC',
    })
    expect(() => dtf.format(date1)).not.toThrow()
  })
  it.skip('GH issue #2915', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00 AM – 6/19/2021, 1:00 PM'
    )
  })
  it('toLocaleString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleTimeString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleTimeString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleDateString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleDateString('en-US')).toBe('Invalid Date')
  })
})
