/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {IntlMessageFormat} from '../src/core';
import {PART_TYPE} from '../src/formatters';
import {parse} from 'intl-messageformat-parser';
import 'jasmine-expect';

describe('IntlMessageFormat', function () {
  it('should be a function', function () {
    expect(typeof IntlMessageFormat).toBe('function');
  });

  it('should accept formatters', function () {
    const mf = new IntlMessageFormat(
      'My name is {FIRST} {LAST}, age {age, number}, time {time, time}, date {date, date}.',
      'en',
      undefined
    );
    const ts = 12 * 3600 * 1e3;
    const output = mf.format({
      FIRST: 'Anthony',
      LAST: 'Pipkin',
      age: 8,
      time: ts,
      date: ts,
    });

    expect(output).toContain('My name is Anthony Pipkin, age 8');
    expect(output).toContain(new Intl.DateTimeFormat().format(ts));
  });

  // INSTANCE METHODS

  describe('#resolvedOptions( )', function () {
    it('should be a function', function () {
      const mf = new IntlMessageFormat('');
      expect(typeof mf.resolvedOptions).toBe('function');
    });

    it('should have a `locale` property', function () {
      const mf = new IntlMessageFormat('');
      expect(Object.keys(mf.resolvedOptions())).toContain('locale');
    });

    describe('`locale`', function () {
      it('should default to host locale', function () {
        const mf = new IntlMessageFormat('');
        expect(mf.resolvedOptions().locale).toBe(
          new Intl.NumberFormat().resolvedOptions().locale
        );
      });

      it('should normalize the casing', function () {
        let mf = new IntlMessageFormat('', 'en-us');
        expect(mf.resolvedOptions().locale).toBe('en-US');

        mf = new IntlMessageFormat('', 'EN-US');
        expect(mf.resolvedOptions().locale).toBe('en-US');
      });
    });
  });

  it('should handle @ correctly', function () {
    const mf = new IntlMessageFormat('hi @{there}', 'en');
    expect(
      mf.format({
        there: '2008',
      })
    ).toBe('hi @2008');
  });

  describe('#format( [object] )', function () {
    it('should be a function', function () {
      const mf = new IntlMessageFormat('');
      expect(typeof mf.format).toBe('function');
    });

    it('should return a string', function () {
      const mf = new IntlMessageFormat('');
      expect(typeof mf.format()).toBe('string');
    });
  });

  describe('#format([ast])', function () {
    it('should format ast', function () {
      const mf = new IntlMessageFormat(parse('hello world'));
      expect(mf.format()).toBe('hello world');
    });
    it('should format ast w/ placeholders', function () {
      const mf = new IntlMessageFormat(parse('hello world, {name}'));
      expect(mf.format({name: 'foo'})).toBe('hello world, foo');
    });
    it('should format ast w/o parser', function () {
      const mf = new IntlMessageFormat(parse('hello world'));
      expect(mf.format()).toBe('hello world');
    });
    it('should format ast w/ placeholders w/o parser', function () {
      const mf = new IntlMessageFormat(parse('hello world, {name}'));
      expect(mf.format({name: 'foo'})).toBe('hello world, foo');
    });
  });

  describe('using a string pattern', function () {
    it('should properly replace direct arguments in the string', function () {
      const mf = new IntlMessageFormat('My name is {FIRST} {LAST}.');
      const output = mf.format({
        FIRST: 'Anthony',
        LAST: 'Pipkin',
      });

      expect(output).toBe('My name is Anthony Pipkin.');
    });

    it('should not ignore zero values', function () {
      const mf = new IntlMessageFormat('I am {age} years old.');
      const output = mf.format({
        age: 0,
      });

      expect(output).toBe('I am 0 years old.');
    });

    it('should ignore false, null, and undefined', function () {
      const mf = new IntlMessageFormat('{a}{b}{c}');
      const output = mf.format({
        a: false,
        b: null,
        c: undefined,
      });

      expect(output).toBe('');
    });
  });

  describe('and plurals under the Arabic locale', function () {
    const msg =
      '' +
      'I have {numPeople, plural,' +
      'zero {zero points}' +
      'one {a point}' +
      'two {two points}' +
      'few {a few points}' +
      'many {lots of points}' +
      'other {some other amount of points}}' +
      '.';

    const msgFmt = new IntlMessageFormat(msg, 'ar');

    it('should match zero', function () {
      const m = msgFmt.format({
        numPeople: 0,
      });

      expect(m).toBe('I have zero points.');
    });

    it('should match one', function () {
      const m = msgFmt.format({
        numPeople: 1,
      });

      expect(m).toBe('I have a point.');
    });

    it('should match two', function () {
      const m = msgFmt.format({
        numPeople: 2,
      });

      expect(m).toBe('I have two points.');
    });

    it('should match few', function () {
      const m = msgFmt.format({
        numPeople: 5,
      });

      expect(m).toBe('I have a few points.');
    });

    it('should match many', function () {
      const m = msgFmt.format({
        numPeople: 20,
      });

      expect(m).toBe('I have lots of points.');
    });

    it('should match other', function () {
      const m = msgFmt.format({
        numPeople: 100,
      });

      expect(m).toBe('I have some other amount of points.');
    });
  });

  describe('and plurals under the Welsh locale', function () {
    const msg =
      '' +
      'I have {numPeople, plural,' +
      'zero {zero points}' +
      'one {a point}' +
      'two {two points}' +
      'few {a few points}' +
      'many {lots of points}' +
      'other {some other amount of points}}' +
      '.';

    const msgFmt = new IntlMessageFormat(msg, 'cy');

    it('should match zero', function () {
      const m = msgFmt.format({
        numPeople: 0,
      });

      expect(m).toBe('I have zero points.');
    });

    it('should match one', function () {
      const m = msgFmt.format({
        numPeople: 1,
      });

      expect(m).toBe('I have a point.');
    });

    it('should match two', function () {
      const m = msgFmt.format({
        numPeople: 2,
      });

      expect(m).toBe('I have two points.');
    });

    it('should match few', function () {
      const m = msgFmt.format({
        numPeople: 3,
      });

      expect(m).toBe('I have a few points.');
    });

    it('should match many', function () {
      const m = msgFmt.format({
        numPeople: 6,
      });

      expect(m).toBe('I have lots of points.');
    });

    it('should match other', function () {
      const m = msgFmt.format({
        numPeople: 100,
      });

      expect(m).toBe('I have some other amount of points.');
    });
  });

  describe('and changing the locale', function () {
    const simple = {
      en: '{NAME} went to {CITY}.',

      fr:
        '{NAME} est {GENDER, select, ' +
        'female {allée}' +
        'other {allé}}' +
        ' à {CITY}.',
    };

    const complex = {
      en: '{TRAVELLERS} went to {CITY}.',

      fr:
        '{TRAVELLERS} {TRAVELLER_COUNT, plural, ' +
        '=1 {est {GENDER, select, ' +
        'female {allée}' +
        'other {allé}}}' +
        'other {sont {GENDER, select, ' +
        'female {allées}' +
        'other {allés}}}}' +
        ' à {CITY}.',
    };

    const maleObj = {
      NAME: 'Tony',
      CITY: 'Paris',
      GENDER: 'male',
    };

    const femaleObj = {
      NAME: 'Jenny',
      CITY: 'Paris',
      GENDER: 'female',
    };

    const maleTravelers = {
      TRAVELLERS: 'Lucas, Tony and Drew',
      TRAVELLER_COUNT: 3,
      GENDER: 'male',
      CITY: 'Paris',
    };

    const femaleTravelers = {
      TRAVELLERS: 'Monica',
      TRAVELLER_COUNT: 1,
      GENDER: 'female',
      CITY: 'Paris',
    };

    it('should format message en-US simple with different objects', function () {
      const msgFmt = new IntlMessageFormat(simple.en, 'en-US');
      expect(msgFmt.format(maleObj)).toBe('Tony went to Paris.');
      expect(msgFmt.format(femaleObj)).toBe('Jenny went to Paris.');
    });

    it('should format message fr-FR simple with different objects', function () {
      const msgFmt = new IntlMessageFormat(simple.fr, 'fr-FR');
      expect(msgFmt.format(maleObj)).toBe('Tony est allé à Paris.');
      expect(msgFmt.format(femaleObj)).toBe('Jenny est allée à Paris.');
    });

    it('should format message en-US complex with different objects', function () {
      const msgFmt = new IntlMessageFormat(complex.en, 'en-US');
      expect(msgFmt.format(maleTravelers)).toBe(
        'Lucas, Tony and Drew went to Paris.'
      );
      expect(msgFmt.format(femaleTravelers)).toBe('Monica went to Paris.');
    });

    it('should format message fr-FR complex with different objects', function () {
      const msgFmt = new IntlMessageFormat(complex.fr, 'fr-FR');
      expect(msgFmt.format(maleTravelers)).toBe(
        'Lucas, Tony and Drew sont allés à Paris.'
      );
      expect(msgFmt.format(femaleTravelers)).toBe('Monica est allée à Paris.');
    });
  });

  describe('and change the locale with different counts', function () {
    const messages = {
      en:
        '{COMPANY_COUNT, plural, ' +
        '=1 {One company}' +
        'other {# companies}}' +
        ' published new books.',

      ru:
        '{COMPANY_COUNT, plural, ' +
        '=1 {Одна компания опубликовала}' +
        'one {# компания опубликовала}' +
        'few {# компании опубликовали}' +
        'many {# компаний опубликовали}' +
        'other {# компаний опубликовали}}' +
        ' новые книги.',
    };

    it('should format a message with en-US locale', function () {
      const msgFmt = new IntlMessageFormat(messages.en, 'en-US');

      expect(msgFmt.format({COMPANY_COUNT: 0})).toBe(
        '0 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 1})).toBe(
        'One company published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 2})).toBe(
        '2 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 5})).toBe(
        '5 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 10})).toBe(
        '10 companies published new books.'
      );
    });

    it('should format a message with ru-RU locale', function () {
      const msgFmt = new IntlMessageFormat(messages.ru, 'ru-RU');

      expect(msgFmt.format({COMPANY_COUNT: 0})).toBe(
        '0 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 1})).toBe(
        'Одна компания опубликовала новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 2})).toBe(
        '2 компании опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 5})).toBe(
        '5 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 10})).toBe(
        '10 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 21})).toBe(
        '21 компания опубликовала новые книги.'
      );
    });
  });

  describe('arguments with', function () {
    describe('no spaces', function () {
      const msg = new IntlMessageFormat('{STATE}'),
        state = 'Missouri';

      it('should fail when the argument in the pattern is not provided', function () {
        expect(msg.format).toThrow(
          Error(
            'The intl string context variable "STATE" was not provided to the string "{STATE}"'
          )
        );
      });

      it('should fail when the argument in the pattern has a typo', function () {
        function formatWithValueNameTypo() {
          return msg.format({'ST ATE': state});
        }

        expect(formatWithValueNameTypo).toThrow(
          Error(
            'The intl string context variable "STATE" was not provided to the string "{STATE}"'
          )
        );
      });

      it('should succeed when the argument is correct', function () {
        expect(msg.format({STATE: state})).toBe(state);
      });
    });

    describe('a numeral', function () {
      const msg = new IntlMessageFormat('{ST1ATE}');
      const state = 'Missouri';

      it('should fail when the argument in the pattern is not provided', function () {
        function formatWithMissingValue() {
          return msg.format({FOO: state});
        }

        expect(formatWithMissingValue).toThrow(
          Error(
            'The intl string context variable "ST1ATE" was not provided to the string "{ST1ATE}"'
          )
        );
      });

      it('should fail when the argument in the pattern has a typo', function () {
        function formatWithMissingValue() {
          msg.format({'ST ATE': state});
        }

        expect(formatWithMissingValue).toThrow(
          Error(
            'The intl string context variable "ST1ATE" was not provided to the string "{ST1ATE}"'
          )
        );
      });

      it('should succeed when the argument is correct', function () {
        expect(msg.format({ST1ATE: state})).toBe(state);
      });
    });
  });

  describe('selectordinal arguments', function () {
    const msg =
      'This is my {year, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} birthday.';

    it('should parse without errors', function () {
      expect(() => IntlMessageFormat.__parse!(msg)).not.toThrow();
    });

    it('should use ordinal pluralization rules', function () {
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.format({year: 1})).toBe('This is my 1st birthday.');
      expect(mf.format({year: 2})).toBe('This is my 2nd birthday.');
      expect(mf.format({year: 3})).toBe('This is my 3rd birthday.');
      expect(mf.format({year: 4})).toBe('This is my 4th birthday.');
      expect(mf.format({year: 11})).toBe('This is my 11th birthday.');
      expect(mf.format({year: 21})).toBe('This is my 21st birthday.');
      expect(mf.format({year: 22})).toBe('This is my 22nd birthday.');
      expect(mf.format({year: 33})).toBe('This is my 33rd birthday.');
      expect(mf.format({year: 44})).toBe('This is my 44th birthday.');
      expect(mf.format({year: 1024})).toBe('This is my 1,024th birthday.');
    });
  });

  describe('exceptions', function () {
    it('should use the correct PT plural rules', function () {
      const msg = '{num, plural, one{one} other{other}}';
      const pt = new IntlMessageFormat(msg, 'pt');
      const ptMZ = new IntlMessageFormat(msg, 'pt-MZ');

      expect(pt.format({num: 0})).toBe('one');
      // According to https://github.com/unicode-cldr/cldr-core/blob/master/supplemental/plurals.json#L599-L606
      expect(ptMZ.format({num: 0})).toBe('one');
      expect(ptMZ.format({num: 100})).toBe('other');
    });

    it('should take negative number as plural', function () {
      const msg =
        '{num, plural, offset:-1 =-1{negative one} one{one} other{other}}';
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.format({num: -1})).toBe('negative one');
      expect(mf.format({num: 0})).toBe('one');
      expect(mf.format({num: 1})).toBe('other');
    });
    it('should take empty string value', function () {
      const msg = '"{value}"';
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.formatToParts({value: ''})).toEqual([
        {type: PART_TYPE.literal, value: '""'},
      ]);
      expect(mf.format({value: ''})).toBe('""');
    });
  });

  it('should handle offset in plural #', function () {
    const msg = `{num_guests, plural, offset:1
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to their party.}
      =2 {{host} invites {guest} and one other person to their party.}
      other {{host} invites {guest} and # other people to their party.}
    }`;
    const mf = new IntlMessageFormat(msg, 'en');
    expect(mf.format({host: 'The host', guest: 'Alice', num_guests: 0})).toBe(
      'The host does not give a party.'
    );
    expect(mf.format({host: 'The host', guest: 'Alice', num_guests: 1})).toBe(
      'The host invites Alice to their party.'
    );
    expect(mf.format({host: 'The host', guest: 'Alice', num_guests: 2})).toBe(
      'The host invites Alice and one other person to their party.'
    );
    expect(mf.format({host: 'The host', guest: 'Alice', num_guests: 3})).toBe(
      'The host invites Alice and 2 other people to their party.'
    );
  });

  it('regression issue #437', function () {
    const mf = new IntlMessageFormat(
      '{score, plural, one {# shopper} other {# shoppers}}',
      'en'
    );
    expect(mf.format({score: 1})).toBe('1 shopper');
    expect(mf.format({score: 2})).toBe('2 shoppers');
  });

  describe('xml', function () {
    it('should handle @ correctly', function () {
      const mf = new IntlMessageFormat('hi @{there}', 'en');
      expect(
        mf.format({
          there: '2008',
        })
      ).toEqual('hi @2008');
    });

    it('simple message', function () {
      const mf = new IntlMessageFormat('hello <b>world</b>', 'en');
      expect(
        mf.format<object>({b: parts => ({parts})})
      ).toEqual(['hello ', {parts: ['world']}]);
    });
    it('nested tag message', function () {
      const mf = new IntlMessageFormat(
        'hello <b>world<i>!</i> <br/> </b>',
        'en'
      );
      expect(
        mf.format<object>({
          b: chunks => ({chunks}),
          i: c => ({val: `$$${c}$$`}),
        })
      ).toEqual(['hello ', {chunks: ['world', {val: '$$!$$'}, ' <br/> ']}]);
    });
    it('deep format nested tag message', function () {
      const mf = new IntlMessageFormat(
        'hello <b>world<i>!</i> <br/> </b>',
        'en'
      );
      expect(
        mf.format<object>({
          b: chunks => ['<b>', ...chunks, '</b>'],
          i: c => ({val: `$$${c}$$`}),
        })
      ).toEqual(['hello <b>world', {val: '$$!$$'}, ' <br/> </b>']);
    });
    it('simple message w/ placeholder and no tag', function () {
      const mf = new IntlMessageFormat('hello {placeholder} {var2}', 'en');
      expect(
        mf.format({
          placeholder: {name: 'gaga'},
          var2: {foo: 1},
        })
      ).toEqual(['hello ', {name: 'gaga'}, ' ', {foo: 1}]);
    });
    it('simple message w/ placeholder', function () {
      const mf = new IntlMessageFormat(
        'hello <b>world</b> <a>{placeholder}</a>',
        'en'
      );
      expect(
        mf.format<object>({
          b: parts => ({parts}),
          placeholder: 'gaga',
          a: parts => ({parts}),
        })
      ).toEqual(['hello ', {parts: ['world']}, ' ', {parts: ['gaga']}]);
    });
    it('message w/ placeholder & HTML entities', function () {
      const mf = new IntlMessageFormat('Hello&lt;<tag>{text}</tag>', 'en');
      expect(
        mf.format<object>({
          tag: parts => ({parts}),
          text: '<asd>',
        })
      ).toEqual(['Hello&lt;', {parts: ['<asd>']}]);
    });
    it('message w/ placeholder & >', function () {
      const mf = new IntlMessageFormat(
        '&lt; hello <b>world</b> {token} &lt;&gt; <a>{placeholder}</a>',
        'en'
      );
      expect(
        mf.format<object>({
          b: parts => ({parts}),
          token: '<asd>',
          placeholder: '>',
          a: parts => ({parts}),
        })
      ).toEqual([
        '&lt; hello ',
        {parts: ['world']},
        ' <asd> &lt;&gt; ',
        {parts: ['>']},
      ]);
    });
    it('select message w/ placeholder & >', function () {
      const mf = new IntlMessageFormat(
        '{gender, select, male {&lt; hello <b>world</b> {token} &lt;&gt; <a>{placeholder}</a>} female {<b>foo &lt;&gt; bar</b>}}',
        'en'
      );
      expect(
        mf.format<object>({
          gender: 'male',
          b: str => ({str}),
          token: '<asd>',
          placeholder: '>',
          a: str => ({str}),
        })
      ).toEqual([
        '&lt; hello ',
        {str: ['world']},
        ' <asd> &lt;&gt; ',
        {str: ['>']},
      ]);
      expect(
        mf.format<object>({
          gender: 'female',
          b: str => ({str}),
        })
      ).toEqual({str: ['foo &lt;&gt; bar']});
    });
    it('should allow escaping tag as legacy HTML', function () {
      const mf = new IntlMessageFormat(
        "hello '<b>world</b>' '<a>'{placeholder}'</a>'",
        'en'
      );
      expect(
        mf.format({
          placeholder: '<foo>gaga</foo>',
        })
      ).toEqual('hello <b>world</b> <a><foo>gaga</foo></a>');
    });
    it('should handle tag w/ rich text', function () {
      const mf = new IntlMessageFormat('hello <foo>{bar}</foo> test', 'en');
      expect(
        mf.format<object>({
          foo: obj => ({
            obj,
          }),
          bar: {bar: 1},
        })
      ).toEqual(['hello ', {obj: [{bar: 1}]}, ' test']);
    });
    it('should handle tag in plural', function () {
      const mf = new IntlMessageFormat(
        'You have {count, plural, =1 {<b>1</b> Message} other {<b>#</b> Messages}}',
        'en'
      );
      expect(
        mf.format<string>({
          b: chunks => `{}${chunks}{}`,
          count: 1000,
        })
      ).toBe('You have {}1,000{} Messages');
    });
  });

  it('custom formats should work for time', function () {
    const msg = 'Today is {time, time, verbose}';
    const mf = new IntlMessageFormat(msg, 'en', {
      time: {
        verbose: {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZoneName: 'short',
        },
      },
    });
    expect(mf.format({time: new Date(0)})).toContain(
      new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      }).format(0)
    );
  });

  it('custom formats should work for date', function () {
    const msg = 'Today is {time, date, verbose}';
    const mf = new IntlMessageFormat(msg, 'en', {
      date: {
        verbose: {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZoneName: 'short',
        },
      },
    });
    expect(mf.format({time: 0})).toContain(
      new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      }).format(0)
    );
  });

  it('custom formats should work for number', function () {
    const msg = 'Today is {time, number, verbose}';
    const mf = new IntlMessageFormat(msg, 'en', {
      number: {
        verbose: {
          minimumFractionDigits: 5,
          maximumFractionDigits: 5,
        },
      },
    });
    expect(mf.format({time: 0.1234567})).toContain(
      new Intl.NumberFormat('en', {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      }).format(0.1234567)
    );
  });

  describe('# symbol in plural rule argument', () => {
    it('replaces unquoted # symbol in the plural rule option with actual number', () => {
      const mf = new IntlMessageFormat(
        'You {count, plural, one {worked for # hour} other {worked for # hours}} today.',
        'en'
      );
      expect(mf.format({count: 1})).toBe('You worked for 1 hour today.');
      expect(mf.format({count: 3})).toBe('You worked for 3 hours today.');
    });

    it('preserves quoted # symbol in the plural option', () => {
      const mf = new IntlMessageFormat(
        "You {count, plural, one {worked for '#' hour} other {worked for '#' hours}} today.",
        'en'
      );
      expect(mf.format({count: 1})).toBe('You worked for # hour today.');
      expect(mf.format({count: 3})).toBe('You worked for # hours today.');
    });

    it('does not format # symbol in the plural option as a standalone part', () => {
      const mf = new IntlMessageFormat(
        'You {count, plural, one {worked for # hour} other {worked for # hours}} today.',
        'en'
      );
      expect(mf.formatToParts({count: 1})).toEqual([
        {type: PART_TYPE.literal, value: 'You worked for 1 hour today.'},
      ]);
    });

    it('does not replace # symbol in deeply nested sub messages', () => {
      const mf = new IntlMessageFormat(
        `You {count, plural,
          one {worked for {unit, select,
            hour {# hour}
            other {# unit}
          }}
          other {worked for {unit, select,
            hour {# hours}
            other {# units}
          }}
        } today.`,
        'en'
      );
      expect(mf.format({count: 1, unit: 'hour'})).toBe(
        'You worked for # hour today.'
      );
      expect(mf.format({count: 3, unit: 'hour'})).toBe(
        'You worked for # hours today.'
      );
    });
  });

  it('number skeleton', function () {
    expect(
      new IntlMessageFormat(
        '{amount, number, ::currency/CAD .0 group-off}',
        'en-US'
      ).format({amount: 123456.78})
    ).toMatch(/\$123456.8/); // Deal w/ IE11
    expect(
      new IntlMessageFormat(
        '{amount, number, ::currency/GBP .0#}',
        'en-US'
      ).format({amount: 123456.789})
    ).toBe('£123,456.79');
  });

  it('date skeleton', function () {
    expect(
      new IntlMessageFormat('{d, date, ::yyyyMMMdd}', 'en-US').format({
        d: new Date(0),
      })
    ).toMatch(/[A-Z][a-z]{2}(.*?)\d{2}(.*?),(.*?)\d{4}/); // Deal w/ IE11
    expect(
      new IntlMessageFormat('{d, date, ::yyyyMMdd}', 'en-US').format({
        d: new Date(0),
      })
    ).toMatch(/\d{2}(.*?)\/(.*?)\d{2}(.*?)\/(.*?)\d{4}/); // Deal w/ IE11
  });
  // Node 10 DateTimeFormat hour: 2-digit is buggy
  if (!process.version || process.version.indexOf('v10') < 0) {
    it('time skeleton', function () {
      expect(
        new IntlMessageFormat('{d, time, ::hhmmss}', 'en-US').format({
          d: new Date(0),
        })
      ).toMatch(/\d{2}(.*?):(.*?)\d{2}(.*?):(.*?)\d{2}(.*?)[AP]M/); // Deal w/ IE11
      expect(
        new IntlMessageFormat('{d, time, ::hhmmssz}', 'en-US').format({
          d: new Date(0),
        })
      ).toMatch(/\d{2}(.*?):(.*?)\d{2}(.*?):(.*?)\d{2}(.*?)[AP]M/); // Deal w/ IE11
    });
  }

  describe('formatToParts', function () {
    it('should be able to take React Element', function () {
      const element = {};
      const parts = new IntlMessageFormat(
        'a react {element}',
        'en'
      ).formatToParts({
        element,
      });
      expect(parts).toEqual([
        {type: PART_TYPE.literal, value: 'a react '},
        {type: PART_TYPE.object, value: element},
      ]);
    });
  });

  describe('no locale', function () {
    describe('no locale provided', function () {
      it('should default to English', function () {
        const msg = new IntlMessageFormat(
          'I have {NUM_BOOKS, plural, =1 {1 book} other {# books}}.'
        );
        expect(msg.resolvedOptions().locale).toBe(
          new Intl.NumberFormat().resolvedOptions().locale
        );
        expect(msg.format({NUM_BOOKS: 2})).toBe('I have 2 books.');
      });
    });

    describe('invalid locale default', function () {
      it('should fallback to default locale', function () {
        const msg = new IntlMessageFormat(
          '{COMPANY_COUNT, plural, =1 {One company} other {# companies}} published new books.',
          'fu-BA'
        );
        const m = msg.format({COMPANY_COUNT: 1});

        expect(m).toBe('One company published new books.');
      });
    });
  });
});
