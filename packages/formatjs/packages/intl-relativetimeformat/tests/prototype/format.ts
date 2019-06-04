import IntlRelativeTimeFormat from '../../src/locales';
import { Unit } from '../../src';
import { expect as chaiExpect } from 'chai';
declare var expect: typeof chaiExpect;

const units: Unit[] = [
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year'
];

function always(s: string) {
  return {
    many: s,
    few: s,
    one: s
  };
}

function isIE11(): boolean {
  return typeof Symbol === 'undefined'
}

function verifyProperty(obj: any, property: string, desc: PropertyDescriptor) {
  const ownDesc = Object.getOwnPropertyDescriptor(obj, property);
  (Object.keys(desc) as Array<keyof PropertyDescriptor>).forEach(d =>
    expect(ownDesc![d]).to.equal(desc[d], d)
  );
}
// These are from https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat
describe('intl-relativetimeformat', function() {
  describe('prototype', function() {
    it('prop-desc', function() {
      verifyProperty(IntlRelativeTimeFormat, 'prototype', {
        writable: false,
        enumerable: false,
        configurable: false
      });
    });
    describe('constructor', function() {
      it('prop-desc', function() {
        verifyProperty(IntlRelativeTimeFormat.prototype, 'constructor', {
          value: IntlRelativeTimeFormat,
          writable: true,
          enumerable: false,
          configurable: true
        });
      });
    });
    it('branding', function() {
      const fn = IntlRelativeTimeFormat.prototype.format;

      expect(() => fn.call(undefined)).to.throw(TypeError, 'undefined');
      expect(() => fn.call(null)).to.throw(TypeError, 'null');
      expect(() => fn.call(true)).to.throw(TypeError, 'true');
      expect(() => fn.call('')).to.throw(TypeError);
      if (typeof Symbol !== 'undefined') {
        expect(() => fn.call(Symbol())).to.throw(TypeError, 'Symbol()');
      }
      expect(() => fn.call(1)).to.throw(TypeError, '1');
      expect(() => fn.call({})).to.throw(TypeError, 'object');
      expect(() => fn.call(IntlRelativeTimeFormat)).to.throw(
        TypeError,
        'RelativeTimeFormat'
      );
      expect(() => fn.call(IntlRelativeTimeFormat.prototype)).to.throw(
        TypeError,
        'object'
      );
    });
    describe('format', function() {
      it('prop-desc', function() {
        verifyProperty(IntlRelativeTimeFormat.prototype, 'format', {
          writable: true,
          enumerable: false,
          configurable: true
        });
      });
      describe('unit-invalid', function() {
        const rtf = new IntlRelativeTimeFormat('en-US');
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        it('value', function() {
          const values: any[] = [
            undefined,
            null,
            true,
            1,
            0.1,
            NaN,
            {},
            '',
            'SECOND',
            'MINUTE',
            'HOUR',
            'DAY',
            'WEEK',
            'MONTH',
            'QUARTER',
            'YEAR',
            'decade',
            'decades',
            'century',
            'centuries',
            'millisecond',
            'milliseconds',
            'microsecond',
            'microseconds',
            'nanosecond',
            'nanoseconds'
          ];
          for (const value of values) {
            expect(() => rtf.format(0, value)).to.throw(
              RangeError,
              String(value)
            );
          }
          if (typeof Symbol !== 'undefined') {
            const symbol: any = Symbol();
            expect(() => rtf.format(0, symbol)).to.throw(
              RangeError,
              'Symbol()'
            );
          }
        });
      });
      describe('unit-plural', function() {
        const rtf = new IntlRelativeTimeFormat('en-US');
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        it('value', function() {
          const units = [
            'second',
            'minute',
            'hour',
            'day',
            'week',
            'month',
            // 'quarter',
            'year'
          ];

          for (const unit of units) {
            expect(rtf.format(3, (unit + 's') as Unit)).to.equal(
              rtf.format(3, unit as Unit),
              `Should support unit ${unit}s as a synonym for ${unit}`
            );
          }
        });
      });
      describe('en-us-numeric-always', function() {
        const rtf = new IntlRelativeTimeFormat('en-US');
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });

        units.forEach(unit =>
          it(unit, function() {
            expect(rtf.format(1000, unit)).to.equal(`in 1,000 ${unit}s`);
            expect(rtf.format(10, unit)).to.equal(`in 10 ${unit}s`);
            expect(rtf.format(2, unit)).to.equal(`in 2 ${unit}s`);
            expect(rtf.format(1, unit)).to.equal(`in 1 ${unit}`);
            expect(rtf.format(0, unit)).to.equal(`in 0 ${unit}s`);
            expect(rtf.format(-0, unit)).to.equal(`0 ${unit}s ago`);
            expect(rtf.format(-1, unit)).to.equal(`1 ${unit} ago`);
            expect(rtf.format(-2, unit)).to.equal(`2 ${unit}s ago`);
            expect(rtf.format(-10, unit)).to.equal(`10 ${unit}s ago`);
            expect(rtf.format(-1000, unit)).to.equal(`1,000 ${unit}s ago`);
          })
        );
      });

      describe('en-us-numeric-auto', function() {
        const rtf = new IntlRelativeTimeFormat('en-US', { numeric: 'auto' });
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        const exceptions = {
          year: {
            '-1': 'last year',
            '0': 'this year',
            '1': 'next year'
          },
          quarter: {
            '-1': 'last quarter',
            '0': 'this quarter',
            '1': 'next quarter'
          },
          month: {
            '-1': 'last month',
            '0': 'this month',
            '1': 'next month'
          },
          week: {
            '-1': 'last week',
            '0': 'this week',
            '1': 'next week'
          },
          day: {
            '-1': 'yesterday',
            '0': 'today',
            '1': 'tomorrow'
          },
          hour: {
            '0': 'this hour'
          },
          minute: {
            '0': 'this minute'
          },
          second: {
            '-1': '1 second ago',
            '0': 'now',
            '1': 'in 1 second'
          }
        };
        units.forEach(unit =>
          it(unit, function() {
            const expected =
              unit in exceptions
                ? [
                    (exceptions[unit as 'year'] as any)['1'] || `in 1 ${unit}`,
                    (exceptions[unit as 'year'] as any)['0'] || `in 0 ${unit}s`,
                    (exceptions[unit as 'year'] as any)['0'] ||
                      `0 ${unit}s ago`,
                    (exceptions[unit as 'year'] as any)['-1'] || `1 ${unit} ago`
                  ]
                : [
                    `in 1 ${unit}`,
                    `in 0 ${unit}s`,
                    `0 ${unit}s ago`,
                    `1 ${unit} ago`
                  ];

            expect(rtf.format(1000, unit)).to.equal(`in 1,000 ${unit}s`);
            expect(rtf.format(10, unit)).to.equal(`in 10 ${unit}s`);
            expect(rtf.format(2, unit)).to.equal(`in 2 ${unit}s`);
            expect(rtf.format(1, unit)).to.equal(expected[0]);
            expect(rtf.format(0, unit)).to.equal(expected[1]);
            expect(rtf.format(-0, unit)).to.equal(expected[2]);
            expect(rtf.format(-1, unit)).to.equal(expected[3]);
            expect(rtf.format(-2, unit)).to.equal(`2 ${unit}s ago`);
            expect(rtf.format(-10, unit)).to.equal(`10 ${unit}s ago`);
            expect(rtf.format(-1000, unit)).to.equal(`1,000 ${unit}s ago`);
          })
        );
      });
      it('length', function() {
        verifyProperty(IntlRelativeTimeFormat.prototype.format, 'length', {
          value: 2,
          writable: false,
          enumerable: false,
          configurable: !isIE11()
        });
      });
      if (!isIE11()) {
        it('name', function() {
          verifyProperty(IntlRelativeTimeFormat.prototype.format, 'name', {
            value: 'format',
            writable: false,
            enumerable: false,
            configurable: true
          });
        });
      }

      describe('pl-pl-style-short', function() {
        const units = {
          second: always('sek.'),
          minute: always('min'),
          hour: always('godz.'),
          day: {
            many: 'dni',
            few: 'dni',
            one: 'dzień'
          },
          week: {
            many: 'tyg.',
            few: 'tyg.',
            one: 'tydz.'
          },
          month: always('mies.'),
          quarter: always('kw.'),
          year: {
            many: 'lat',
            few: 'lata',
            one: 'rok'
          }
        };

        const rtf = new IntlRelativeTimeFormat('pl-PL', {
          style: 'short'
        });
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        (Object.keys(units) as Unit[]).forEach(unitArgument =>
          it(unitArgument, function() {
            const expected = units[unitArgument];
            expect(rtf.format(1000, unitArgument)).to.equal(
              `za 1\u00a0000 ${expected.many}`
            );
            expect(rtf.format(10, unitArgument)).to.equal(
              `za 10 ${expected.many}`
            );
            expect(rtf.format(2, unitArgument)).to.equal(
              `za 2 ${expected.few}`
            );
            expect(rtf.format(1, unitArgument)).to.equal(
              `za 1 ${expected.one}`
            );
            expect(rtf.format(0, unitArgument)).to.equal(
              `za 0 ${expected.many}`
            );
            expect(rtf.format(-0, unitArgument)).to.equal(
              `0 ${expected.many} temu`
            );
            expect(rtf.format(-1, unitArgument)).to.equal(
              `1 ${expected.one} temu`
            );
            expect(rtf.format(-2, unitArgument)).to.equal(
              `2 ${expected.few} temu`
            );
            expect(rtf.format(-10, unitArgument)).to.equal(
              `10 ${expected.many} temu`
            );
            expect(rtf.format(-1000, unitArgument)).to.equal(
              `1\u00a0000 ${expected.many} temu`
            );
          })
        );
      });
      describe('pl-pl-style-narrow', function() {
        const units = {
          second: always('s'),
          minute: always('min'),
          hour: always('g.'),
          day: {
            many: 'dni',
            few: 'dni',
            one: 'dzień'
          },
          week: {
            many: 'tyg.',
            few: 'tyg.',
            one: 'tydz.'
          },
          month: always('mies.'),
          quarter: always('kw.'),
          year: {
            many: 'lat',
            few: 'lata',
            one: 'rok'
          }
        };

        const rtf = new IntlRelativeTimeFormat('pl-PL', {
          style: 'narrow'
        });
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        (Object.keys(units) as Unit[]).forEach(unitArgument =>
          it(unitArgument, function() {
            const expected = units[unitArgument];
            expect(rtf.format(1000, unitArgument)).to.equal(
              `za 1\u00a0000 ${expected.many}`
            );
            expect(rtf.format(10, unitArgument)).to.equal(
              `za 10 ${expected.many}`
            );
            expect(rtf.format(2, unitArgument)).to.equal(
              `za 2 ${expected.few}`
            );
            expect(rtf.format(1, unitArgument)).to.equal(
              `za 1 ${expected.one}`
            );
            expect(rtf.format(0, unitArgument)).to.equal(
              `za 0 ${expected.many}`
            );
            expect(rtf.format(-0, unitArgument)).to.equal(
              `0 ${expected.many} temu`
            );
            expect(rtf.format(-1, unitArgument)).to.equal(
              `1 ${expected.one} temu`
            );
            expect(rtf.format(-2, unitArgument)).to.equal(
              `2 ${expected.few} temu`
            );
            expect(rtf.format(-10, unitArgument)).to.equal(
              `10 ${expected.many} temu`
            );
            expect(rtf.format(-1000, unitArgument)).to.equal(
              `1\u00a0000 ${expected.many} temu`
            );
          })
        );
      });
      describe('pl-pl-style-long', function() {
        function regular(s: string) {
          return {
            many: s,
            few: s + 'y',
            one: s + 'ę'
          };
        }

        // https://www.unicode.org/cldr/charts/33/summary/pl.html#1419
        const units = {
          second: regular('sekund'),
          minute: regular('minut'),
          hour: regular('godzin'),
          day: {
            many: 'dni',
            few: 'dni',
            one: 'dzień'
          },
          week: {
            many: 'tygodni',
            few: 'tygodnie',
            one: 'tydzień'
          },
          month: {
            1000: 'miesięcy',
            many: 'miesięcy',
            few: 'miesiące',
            one: 'miesiąc'
          },
          quarter: {
            many: 'kwartałów',
            few: 'kwartały',
            one: 'kwartał'
          },
          year: {
            many: 'lat',
            few: 'lata',
            one: 'rok'
          }
        };

        const rtf = new IntlRelativeTimeFormat('pl-PL', {
          style: 'long'
        });
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        (Object.keys(units) as Unit[]).forEach(unitArgument =>
          it(unitArgument, function() {
            const expected = units[unitArgument];
            expect(rtf.format(1000, unitArgument)).to.equal(
              `za 1\u00a0000 ${expected.many}`
            );
            expect(rtf.format(10, unitArgument)).to.equal(
              `za 10 ${expected.many}`
            );
            expect(rtf.format(2, unitArgument)).to.equal(
              `za 2 ${expected.few}`
            );
            expect(rtf.format(1, unitArgument)).to.equal(
              `za 1 ${expected.one}`
            );
            expect(rtf.format(0, unitArgument)).to.equal(
              `za 0 ${expected.many}`
            );
            expect(rtf.format(-0, unitArgument)).to.equal(
              `0 ${expected.many} temu`
            );
            expect(rtf.format(-1, unitArgument)).to.equal(
              `1 ${expected.one} temu`
            );
            expect(rtf.format(-2, unitArgument)).to.equal(
              `2 ${expected.few} temu`
            );
            expect(rtf.format(-10, unitArgument)).to.equal(
              `10 ${expected.many} temu`
            );
            expect(rtf.format(-1000, unitArgument)).to.equal(
              `1\u00a0000 ${expected.many} temu`
            );
          })
        );
      });
      describe('en-us-style-short', function() {
        const units = {
          second: ['sec.'],
          minute: ['min.'],
          hour: ['hr.'],
          day: ['day', 'days'],
          week: ['wk.'],
          month: ['mo.'],
          quarter: ['qtr.', 'qtrs.'],
          year: ['yr.']
        };

        const rtf = new IntlRelativeTimeFormat('en-US', {
          style: 'short'
        });
        it('should be a function', function() {
          expect(typeof rtf.format).to.equal(
            'function',
            'format should be supported'
          );
        });
        (Object.keys(units) as Unit[]).forEach(unitArgument =>
          it(unitArgument, function() {
            let [singular, plural] = units[unitArgument as 'second'];
            if (!plural) {
              plural = singular;
            }

            expect(rtf.format(1000, unitArgument)).to.equal(
              `in 1,000 ${plural}`
            );
            expect(rtf.format(10, unitArgument)).to.equal(`in 10 ${plural}`);
            expect(rtf.format(2, unitArgument)).to.equal(`in 2 ${plural}`);
            expect(rtf.format(1, unitArgument)).to.equal(`in 1 ${singular}`);
            expect(rtf.format(0, unitArgument)).to.equal(`in 0 ${plural}`);
            expect(rtf.format(-0, unitArgument)).to.equal(`0 ${plural} ago`);
            expect(rtf.format(-1, unitArgument)).to.equal(`1 ${singular} ago`);
            expect(rtf.format(-2, unitArgument)).to.equal(`2 ${plural} ago`);
            expect(rtf.format(-10, unitArgument)).to.equal(`10 ${plural} ago`);
            expect(rtf.format(-1000, unitArgument)).to.equal(
              `1,000 ${plural} ago`
            );
          })
        );
      });
    });
  });
});
