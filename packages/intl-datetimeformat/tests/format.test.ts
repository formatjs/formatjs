import {DateTimeFormat, DateTimeFormatOptions} from '../';
import * as ko from './locale-data/ko.json';
import * as en from './locale-data/en.json';
import allData from '../src/data/all-tz';
import {
  toLocaleString,
  toLocaleDateString,
  toLocaleTimeString,
} from '../src/to_locale_string';

// @ts-ignore
DateTimeFormat.__addLocaleData(en, ko);
DateTimeFormat.__addTZData(allData);

const tests: Array<{options: DateTimeFormatOptions; ko: string; en: string}> = [
  {
    options: {
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
    },
    ko: '서기 2020년 6 16일 화요일 AM 4시 48분 20초 협정 세계시',
    en:
      'Tuesday, 6 16, 2020 Anno Domini, 4:48:20 AM Coordinated Universal Time',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    },
    ko: '서기 2020년 6 16일 화요일 AM 12시 48분 20초 GMT-4',
    en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: 'numeric',
      month: 'numeric',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    },
    ko: '서기 2020년 6 16일 화요일 AM 12시 48분 20초 GMT-4',
    en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: 'numeric',
      month: 'numeric',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    },
    ko: '서기 2020년 6 16일 화요일 AM 12시 48분 20초 GMT-4',
    en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: 'numeric',
      month: 'numeric',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: '서기 2020년 6 15일 월요일 PM 09시 48분 20초 GMT-7',
    en: 'Monday, 6 15, 2020 Anno Domini, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: '2-digit',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: '서기 20년 6월 15일 월요일 PM 09시 48분 20초 GMT-7',
    en: 'Monday, June 15, 20 Anno Domini, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: '2-digit',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: '서기 20년 6월 15일 월요일 PM 09시 48분 20초 GMT-7',
    en: 'Monday, Jun 15, 20 Anno Domini, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'long',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: '서기 20년 6월 15일 월요일 PM 09시 48분 20초 GMT-7',
    en: 'Monday, J 15, 20 Anno Domini, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'long',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: 'AD 20년 6월 15일 월요일 PM 09시 48분 20초 GMT-7',
    en: 'Monday, J 15, 20 AD, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'narrow',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: 'AD 20년 6월 15일 (월) PM 09시 48분 20초 GMT-7',
    en: 'M, J 15, 20 AD, 09:48:20 PM PDT',
  },
  {
    options: {
      weekday: 'short',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    },
    ko: 'AD 20년 6월 15일 (월) PM 09시 48분 20초 GMT-7',
    en: 'Mon, J 15, 20 AD, 09:48:20 PM PDT',
  },
  {
    options: {dateStyle: 'full', timeZone: 'America/Los_Angeles'},
    ko: '2020년 6월 15일 월요일',
    en: 'Monday, June 15, 2020',
  },
  {
    options: {dateStyle: 'long', timeZone: 'America/Los_Angeles'},
    ko: '2020년 6월 15일',
    en: 'June 15, 2020',
  },
  {
    options: {dateStyle: 'medium', timeZone: 'America/Los_Angeles'},
    ko: '2020. 6. 15.',
    en: 'Jun 15, 2020',
  },
  {
    options: {dateStyle: 'short', timeZone: 'America/Los_Angeles'},
    ko: '20. 6. 15.',
    en: '6/15/20',
  },
  {
    options: {timeStyle: 'full', timeZone: 'America/Los_Angeles'},
    ko: 'PM 9시 48분 20초 미 태평양 하계 표준시',
    en: '9:48:20 PM Pacific Daylight Time',
  },
  {
    options: {timeStyle: 'long', timeZone: 'America/Los_Angeles'},
    ko: 'PM 9시 48분 20초 GMT-7',
    en: '9:48:20 PM PDT',
  },
  {
    options: {timeStyle: 'medium', timeZone: 'America/Los_Angeles'},
    ko: 'PM 9:48:20',
    en: '9:48:20 PM',
  },
  {
    options: {timeStyle: 'short', timeZone: 'America/Los_Angeles'},
    ko: 'PM 9:48',
    en: '9:48 PM',
  },
  {
    options: {
      dateStyle: 'long',
      timeStyle: 'full',
      timeZone: 'America/Los_Angeles',
    },
    ko: '2020년 6월 15일 PM 9시 48분 20초 미 태평양 하계 표준시',
    en: 'June 15, 2020 at 9:48:20 PM Pacific Daylight Time',
  },
  {
    options: {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'America/Los_Angeles',
    },
    ko: '2020. 6. 15. PM 9시 48분 20초 GMT-7',
    en: 'Jun 15, 2020, 9:48:20 PM PDT',
  },
  {
    options: {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Los_Angeles',
    },
    ko: '20. 6. 15. PM 9:48:20',
    en: '6/15/20, 9:48:20 PM',
  },
  {
    options: {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Los_Angeles',
    },
    ko: '2020년 6월 15일 월요일 PM 9:48',
    en: 'Monday, June 15, 2020 at 9:48 PM',
  },
];

const TS = 1592282900463;

// console.log(
//   JSON.stringify(
//     tests.map(({options}) => ({
//       options,
//       ko: new Intl.DateTimeFormat('ko', options).format(TS),
//       en: new Intl.DateTimeFormat('en', options).format(TS),
//     }))
//   )
// );

describe('format', function () {
  tests.forEach(({options, en, ko}) => {
    it(`resolvedOptions ${JSON.stringify(options)}`, function () {
      const resolvedOptions = new DateTimeFormat(
        'ko',
        options
      ).resolvedOptions();
      const result: Record<string, any> = {};
      Object.keys(options).forEach(
        k => (result[k] = resolvedOptions[k as 'day'])
      );
      expect(result).toEqual(options);
    });
    it(`ko ${JSON.stringify(options)}`, function () {
      expect(new DateTimeFormat('ko', options).format(TS)).toBe(ko);
    });
    it(`en ${JSON.stringify(options)}`, function () {
      expect(new DateTimeFormat('en', options).format(TS)).toBe(en);
    });
  });
});

describe('toLocaleString', function () {
  tests.forEach(({options, en, ko}) => {
    it(`ko ${JSON.stringify(options)}`, function () {
      expect(toLocaleString(new Date(TS), 'ko', options)).toBe(ko);
    });
    it(`en ${JSON.stringify(options)}`, function () {
      expect(toLocaleString(new Date(TS), 'en', options)).toBe(en);
    });
  });
});

xdescribe('toLocaleDateString', function () {
  it('ko', function () {
    expect(toLocaleDateString(new Date(TS), 'ko')).toBe('2020. 6. 16.');
  });
  it('en', function () {
    expect(toLocaleDateString(new Date(TS), 'en')).toBe('6/16/2020');
  });
});

describe('toLocaleTimeString', function () {
  it('ko', function () {
    expect(toLocaleTimeString(new Date(TS), 'ko', {timeZone: 'UTC'})).toBe(
      'AM 4:48:20'
    );
  });
  it('en', function () {
    expect(toLocaleTimeString(new Date(TS), 'en', {timeZone: 'UTC'})).toBe(
      '4:48:20 AM'
    );
  });
});
