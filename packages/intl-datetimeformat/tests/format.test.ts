import {DateTimeFormat} from '../src';
import * as ko from '../dist/locale-data/ko.json';
import * as en from '../dist/locale-data/en.json';
import allData from '../src/data';

// @ts-ignore
DateTimeFormat.__addLocaleData(en, ko);
DateTimeFormat.__addTZData(allData);

const tests = [
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: 'numeric',
  //     month: 'numeric',
  //     day: 'numeric',
  //     hour: 'numeric',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     hour12: true,
  //     timeZone: 'UTC',
  //     timeZoneName: 'long',
  //   },
  //   ko: '서기 2020년 6 16일 화요일 오전 4시 48분 20초 협정 세계시',
  //   en:
  //     'Tuesday, 6 16, 2020 Anno Domini, 4:48:20 AM Coordinated Universal Time',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: 'numeric',
  //     month: 'numeric',
  //     day: 'numeric',
  //     hour: 'numeric',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     hour12: true,
  //     timeZone: 'America/New_York',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 2020년 6 16일 화요일 오전 12시 48분 20초 GMT-4',
  //   en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: 'numeric',
  //     month: 'numeric',
  //     day: '2-digit',
  //     hour: 'numeric',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     hour12: true,
  //     timeZone: 'America/New_York',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 2020년 6 16일 화요일 오전 12시 48분 20초 GMT-4',
  //   en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: 'numeric',
  //     month: 'numeric',
  //     day: '2-digit',
  //     hour: 'numeric',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/New_York',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 2020년 6 16일 화요일 오전 12시 48분 20초 GMT-4',
  //   en: 'Tuesday, 6 16, 2020 Anno Domini, 12:48:20 AM EDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: 'numeric',
  //     month: 'numeric',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 2020년 6 15일 월요일 오후 09시 48분 20초 GMT-7',
  //   en: 'Monday, 6 15, 2020 Anno Domini, 09:48:20 PM PDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: '2-digit',
  //     month: 'long',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 20년 6월 15일 월요일 오후 09시 48분 20초 GMT-7',
  //   en: 'Monday, June 15, 20 Anno Domini, 09:48:20 PM PDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: '2-digit',
  //     month: 'short',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 20년 6월 15일 월요일 오후 09시 48분 20초 GMT-7',
  //   en: 'Monday, Jun 15, 20 Anno Domini, 09:48:20 PM PDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'long',
  //     year: '2-digit',
  //     month: 'narrow',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: '서기 20년 6월 15일 월요일 오후 09시 48분 20초 GMT-7',
  //   en: 'Monday, J 15, 20 Anno Domini, 09:48:20 PM PDT',
  // },
  // {
  //   options: {
  //     weekday: 'long',
  //     era: 'short',
  //     year: '2-digit',
  //     month: 'narrow',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: 'AD 20년 6월 15일 월요일 오후 09시 48분 20초 GMT-7',
  //   en: 'Monday, J 15, 20 AD, 09:48:20 PM PDT',
  // },
  // {
  //   options: {
  //     weekday: 'narrow',
  //     era: 'short',
  //     year: '2-digit',
  //     month: 'narrow',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: 'numeric',
  //     second: 'numeric',
  //     timeZone: 'America/Los_Angeles',
  //     timeZoneName: 'short',
  //   },
  //   ko: 'AD 20년 6월 15일 (월) 오후 09시 48분 20초 GMT-7',
  //   en: 'M, J 15, 20 AD, 09:48:20 PM PDT',
  // },
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
    ko: 'AD 20년 6월 15일 (월) 오후 09시 48분 20초 GMT-7',
    en: 'Mon, J 15, 20 AD, 09:48:20 PM PDT',
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
