import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DateTimeFormat} from '../src/core'
import allData from '../src/data/all-tz'
import * as enCA from './locale-data/en-CA.json' with {type: 'json'}
import * as enGB from './locale-data/en-GB.json' with {type: 'json'}
import * as en from './locale-data/en.json' with {type: 'json'}
import * as fa from './locale-data/fa.json' with {type: 'json'}
import * as ja from './locale-data/ja.json' with {type: 'json'}
import * as zhHans from './locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it, afterEach} from 'vitest'
// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, enCA, ja, zhHans, fa)
DateTimeFormat.__addTZData(allData)
const DEFAULT_TIMEZONE = DateTimeFormat.getDefaultTimeZone()
describe('Intl.DateTimeFormat', function () {
  afterEach(() => {
    DateTimeFormat.__setDefaultTimeZone(DEFAULT_TIMEZONE)
  })
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
    ).toBe('12/31/1969, 7:00:00 PM Eastern Standard Time')
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
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
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
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
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
    DateTimeFormat.__setDefaultTimeZone('Asia/Shanghai')
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('8:00 AM')
  })

  it('America/Indiana/Indianapolis, GH #4254', function () {
    DateTimeFormat.__setDefaultTimeZone('America/Indiana/Indianapolis')
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('7:00 PM')
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
    ).toBe('11:55 AM')
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
    expect(formatter.format(date)).toBe('11:55 AM GMT+2')
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
            en: 'Feb 1, 2020, 6:10:10 PM Singapore Standard Time',
            'zh-Hans': '2020年2月月1日 新加坡标准时间 06:10:10',
          },
        },
        {
          timeZoneName: 'short',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM GMT+8',
            'zh-Hans': '2020年2月月1日 GMT+8 06:10:10',
          },
        },
        {
          timeZoneName: 'longGeneric',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM Singapore Standard Time',
            'zh-Hans': '2020年2月月1日 新加坡标准时间 06:10:10',
          },
        },
        {
          timeZoneName: 'shortGeneric',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM Singapore Standard Time',
            'zh-Hans': '2020年2月月1日 新加坡标准时间 06:10:10',
          },
        },
        {
          timeZoneName: 'longOffset',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM Singapore Standard Time',
            'zh-Hans': '2020年2月月1日 新加坡标准时间 06:10:10',
          },
        },
        {
          timeZoneName: 'shortOffset',
          results: {
            en: 'Feb 1, 2020, 6:10:10 PM Singapore Standard Time',
            'zh-Hans': '2020年2月月1日 新加坡标准时间 06:10:10',
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
    expect(dtf.format(date)).toContain('GMT+14')
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
    expect(dtf.format(date)).toContain('GMT+14:00')
  })

  describe('UTC offset timezones (issue #4804)', function () {
    it('should accept +01:00 offset timezone', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+01:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch (Jan 1, 1970 00:00:00 UTC) should be 01:00:00 at +01:00
      expect(dtf.format(new Date(0))).toBe('01/01/1970, 01:00')
    })

    it('should accept -05:00 offset timezone', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '-05:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be Dec 31, 1969 19:00:00 at -05:00
      expect(dtf.format(new Date(0))).toBe('31/12/1969, 19:00')
    })

    it('should handle half-hour offset +05:30', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+05:30',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be 05:30:00 at +05:30
      expect(dtf.format(new Date(0))).toBe('05:30')
    })

    it('should canonicalize offset formats in resolvedOptions', function () {
      // Test that various input formats are canonicalized to ±HH:MM
      const tests = [
        {input: '+01', expected: '+01:00'},
        {input: '+0100', expected: '+01:00'},
        {input: '+01:00', expected: '+01:00'},
        {input: '-05:30', expected: '-05:30'},
      ]

      tests.forEach(({input, expected}) => {
        const dtf = new DateTimeFormat('en-GB', {timeZone: input})
        expect(dtf.resolvedOptions().timeZone).toBe(expected)
      })
    })

    it('should reject invalid offset formats', function () {
      const invalidFormats = ['+24:00', '+01:60', '+1:00', '01:00']

      invalidFormats.forEach(timeZone => {
        expect(() => new DateTimeFormat('en-GB', {timeZone})).toThrow(
          RangeError
        )
      })
    })

    it('should work with @date-fns/tz pattern', function () {
      // This is the exact use case from issue #4804
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+01:00',
        hour: 'numeric',
        timeZoneName: 'longOffset',
      })
      expect(() => dtf.format(new Date('2024-01-01T00:00:00Z'))).not.toThrow()
    })

    it('should handle UTC +00:00 offset', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+00:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be Jan 1, 1970 00:00:00 at +00:00 (same as UTC)
      expect(dtf.format(new Date(0))).toBe('01/01/1970, 00:00')
    })

    it('should produce same output as UTC for +00:00', function () {
      const date = new Date('2024-01-01T12:00:00Z')
      const dtfOffset = new DateTimeFormat('en-GB', {
        timeZone: '+00:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      const dtfUTC = new DateTimeFormat('en-GB', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      expect(dtfOffset.format(date)).toBe(dtfUTC.format(date))
    })
  })

  it('range with ymdhM', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00 AM – 6/19/2021, 1:00 PM'
    )
  })
  it('GH issue #2909', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(() => dtf.formatRange(date1, date2)).not.toThrow()
  })
  it('GH issue #2951', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Etc/UTC',
    })
    expect(() => dtf.format(date1)).not.toThrow()
  })
  it.skip('GH issue #2915', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00 AM – 6/19/2021, 1:00 PM'
    )
  })
  it('toLocaleString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleString returns date and time with the default format, GH #3508', function () {
    const date1 = new Date(0)
    expect(date1.toLocaleString('en-US')).toMatch(
      /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M/
    )
  })
  it('toLocaleTimeString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleTimeString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleDateString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleDateString('en-US')).toBe('Invalid Date')
  })
  it('America/Detroit shows EDT/EST abbreviations, GH #4456', function () {
    const summer = new Date('2024-07-01T12:00:00Z')
    const winter = new Date('2024-01-01T12:00:00Z')

    const summerFmt = new DateTimeFormat('en', {
      timeZone: 'America/Detroit',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(summer)

    const winterFmt = new DateTimeFormat('en', {
      timeZone: 'America/Detroit',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(winter)

    // Should show EDT in summer and EST in winter, not GMT-4 or GMT-5
    expect(summerFmt).toContain('EDT')
    expect(winterFmt).toContain('EST')
  })
  it('America/Phoenix shows MST abbreviation, GH #4456', function () {
    const summer = new Date('2024-07-01T12:00:00Z')

    const summerFmt = new DateTimeFormat('en', {
      timeZone: 'America/Phoenix',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(summer)

    // Phoenix doesn't observe DST, so should show MST year-round, not GMT-7
    expect(summerFmt).toContain('MST')
  })

  it('formatRange with dateStyle and timeStyle, GH #4168', function () {
    // Bug: Using dateStyle/timeStyle causes "Cannot read property 'patternParts' of undefined"
    // when calling formatRange because rangePatterns.default is undefined
    const dtf = new DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    const start = new Date('2023-01-15T10:00:00Z')
    const end = new Date('2023-01-15T14:00:00Z')

    // This should not throw "Cannot read property 'patternParts' of undefined"
    expect(() => dtf.formatRange(start, end)).not.toThrow()

    // Should format as a date range with time range
    const result = dtf.formatRange(start, end)
    expect(result).toBeTruthy()
    expect(result).toContain('10:00') // start time
    expect(result).toContain('2:00') // end time (14:00 UTC = 2:00 PM)
    expect(result).toContain('1/15/23') // date
  })

  it('formatRange with dateStyle/timeStyle different dates, GH #4168', function () {
    // Test with different dates to trigger the fallback pattern
    const start = new Date('2023-01-15T10:00:00Z')
    const end = new Date('2023-02-20T14:00:00Z')

    const dtfEn = new DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    expect(() => dtfEn.formatRange(start, end)).not.toThrow()
    const resultEn = dtfEn.formatRange(start, end)

    // Verify it formats both dates correctly with the range separator
    // Native ICU output: "1/15/23, 6:00 AM – 2/20/23, 10:00 AM"
    // Note: Uses narrow no-break space (\u202f) before AM/PM
    // English uses en dash with thin spaces: "{0}\u2009–\u2009{1}" (U+2009 = thin space)
    expect(resultEn).toBe(
      '1/15/23, 10:00\u202fAM\u2009–\u20092/20/23, 2:00\u202fPM'
    )

    // Test Japanese locale which uses wave dash (～) instead of en dash (–)
    const dtfJa = new DateTimeFormat('ja', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    expect(() => dtfJa.formatRange(start, end)).not.toThrow()
    const resultJa = dtfJa.formatRange(start, end)

    // Japanese uses wave dash without spaces: "{0}～{1}"
    // Native ICU output: "2023/01/15 10:00～2023/02/20 14:00"
    expect(resultJa).toBe('2023/01/15 10:00～2023/02/20 14:00')
  })

  it('Europe/London should show BST during daylight savings time, GH #5114', function () {
    // Issue #5114: DST timezone names not showing correctly for Europe/London
    // During British Summer Time (Mar-Oct), should show "BST" or "GMT+1", not "GMT"
    // This affects multiple locales including cy (Welsh) and en-GB

    DateTimeFormat.__setDefaultTimeZone('Europe/London')

    // Date during British Summer Time (July)
    const summerDate = new Date('2025-07-15T12:00:00Z')

    // Date during standard time (January)
    const winterDate = new Date('2025-01-15T12:00:00Z')

    // Test with en-GB locale
    const summerFmt = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(summerDate)

    const winterFmt = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(winterDate)

    // FIXED: Issue #5114 resolved by falling back to GMT offset format
    // when CLDR doesn't provide a daylight name

    // Summer should show GMT+1 (offset fallback since no localized DST name)
    // Winter should show GMT
    expect(summerFmt).toBe('15 Jul 2025, 13:00 GMT+1') // Correct: shows offset during DST
    expect(winterFmt).toBe('15 Jan 2025, 12:00 GMT') // Correct: shows GMT for standard time

    // Test with long timezone names
    const summerLong = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'long',
    }).format(summerDate)

    // With long format, should show GMT+01:00 (since no localized daylight name)
    // This matches native browser behavior (Firefox, Safari, Chrome all use offset)
    expect(summerLong).toBe('15 Jul 2025, 13:00 GMT+01:00') // Correct: shows offset format
  })
})
