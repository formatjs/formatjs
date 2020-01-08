/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import '@formatjs/intl-pluralrules/polyfill-locales';
import {IntlMessageFormat, createDefaultFormatters} from '../src/core';
import {PART_TYPE} from '../src/formatters';
import {parse} from 'intl-messageformat-parser';
import {expect as chaiExpect} from 'chai';
import memoizeFormatConstructor from 'intl-format-cache';

declare let expect: typeof chaiExpect;

describe('IntlMessageFormat', function() {
  it('should be a function', function() {
    expect(IntlMessageFormat).to.be.a('function');
  });

  it('should accept formatters', function() {
    const mf = new IntlMessageFormat(
      'My name is {FIRST} {LAST}, age {age, number}, time {time, time}, date {date, date}.',
      'en',
      undefined,
      {
        formatters: createDefaultFormatters(),
      }
    );
    const ts = 12 * 3600 * 1e3;
    const output = mf.format({
      FIRST: 'Anthony',
      LAST: 'Pipkin',
      age: 8,
      time: ts,
      date: ts,
    });

    expect(output).to.include('My name is Anthony Pipkin, age 8');
    expect(output).to.include(new Intl.DateTimeFormat().format(ts));
  });

  // INSTANCE METHODS

  describe('#resolvedOptions( )', function() {
    it('should be a function', function() {
      const mf = new IntlMessageFormat('');
      expect(mf.resolvedOptions).to.be.a('function');
    });

    it('should have a `locale` property', function() {
      const mf = new IntlMessageFormat('');
      expect(mf.resolvedOptions()).to.have.key('locale');
    });

    describe('`locale`', function() {
      it('should default to host locale', function() {
        const mf = new IntlMessageFormat('');
        expect(mf.resolvedOptions().locale).to.equal(
          new Intl.NumberFormat().resolvedOptions().locale
        );
      });

      it('should normalize the casing', function() {
        let mf = new IntlMessageFormat('', 'en-us');
        expect(mf.resolvedOptions().locale).to.equal('en-US');

        mf = new IntlMessageFormat('', 'EN-US');
        expect(mf.resolvedOptions().locale).to.equal('en-US');
      });
    });
  });

  it('should handle @ correctly', function() {
    const mf = new IntlMessageFormat('hi @{there}', 'en');
    expect(
      mf.format({
        there: '2008',
      })
    ).to.equal('hi @2008');
  });

  describe('#format( [object] )', function() {
    it('should be a function', function() {
      const mf = new IntlMessageFormat('');
      expect(mf.format).to.be.a('function');
    });

    it('should return a string', function() {
      const mf = new IntlMessageFormat('');
      expect(mf.format()).to.be.a('string');
    });
  });

  describe('#format([ast])', function() {
    it('should format ast', function() {
      const mf = new IntlMessageFormat(parse('hello world'));
      expect(mf.format()).to.equal('hello world');
    });
    it('should format ast w/ placeholders', function() {
      const mf = new IntlMessageFormat(parse('hello world, {name}'));
      expect(mf.format({name: 'foo'})).to.equal('hello world, foo');
    });
    it('should format ast w/o parser', function() {
      const mf = new IntlMessageFormat(parse('hello world'));
      expect(mf.format()).to.equal('hello world');
    });
    it('should format ast w/ placeholders w/o parser', function() {
      const mf = new IntlMessageFormat(parse('hello world, {name}'));
      expect(mf.format({name: 'foo'})).to.equal('hello world, foo');
    });
  });

  describe('using a string pattern', function() {
    it('should properly replace direct arguments in the string', function() {
      const mf = new IntlMessageFormat('My name is {FIRST} {LAST}.');
      const output = mf.format({
        FIRST: 'Anthony',
        LAST: 'Pipkin',
      });

      expect(output).to.equal('My name is Anthony Pipkin.');
    });

    it('should not ignore zero values', function() {
      const mf = new IntlMessageFormat('I am {age} years old.');
      const output = mf.format({
        age: 0,
      });

      expect(output).to.equal('I am 0 years old.');
    });

    it('should ignore false, null, and undefined', function() {
      const mf = new IntlMessageFormat('{a}{b}{c}');
      const output = mf.format({
        a: false,
        b: null,
        c: undefined,
      });

      expect(output).to.equal('');
    });
  });

  describe('and plurals under the Arabic locale', function() {
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

    it('should match zero', function() {
      const m = msgFmt.format({
        numPeople: 0,
      });

      expect(m).to.equal('I have zero points.');
    });

    it('should match one', function() {
      const m = msgFmt.format({
        numPeople: 1,
      });

      expect(m).to.equal('I have a point.');
    });

    it('should match two', function() {
      const m = msgFmt.format({
        numPeople: 2,
      });

      expect(m).to.equal('I have two points.');
    });

    it('should match few', function() {
      const m = msgFmt.format({
        numPeople: 5,
      });

      expect(m).to.equal('I have a few points.');
    });

    it('should match many', function() {
      const m = msgFmt.format({
        numPeople: 20,
      });

      expect(m).to.equal('I have lots of points.');
    });

    it('should match other', function() {
      const m = msgFmt.format({
        numPeople: 100,
      });

      expect(m).to.equal('I have some other amount of points.');
    });
  });

  describe('and plurals under the Welsh locale', function() {
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

    it('should match zero', function() {
      const m = msgFmt.format({
        numPeople: 0,
      });

      expect(m).to.equal('I have zero points.');
    });

    it('should match one', function() {
      const m = msgFmt.format({
        numPeople: 1,
      });

      expect(m).to.equal('I have a point.');
    });

    it('should match two', function() {
      const m = msgFmt.format({
        numPeople: 2,
      });

      expect(m).to.equal('I have two points.');
    });

    it('should match few', function() {
      const m = msgFmt.format({
        numPeople: 3,
      });

      expect(m).to.equal('I have a few points.');
    });

    it('should match many', function() {
      const m = msgFmt.format({
        numPeople: 6,
      });

      expect(m).to.equal('I have lots of points.');
    });

    it('should match other', function() {
      const m = msgFmt.format({
        numPeople: 100,
      });

      expect(m).to.equal('I have some other amount of points.');
    });
  });

  describe('and changing the locale', function() {
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

    it('should format message en-US simple with different objects', function() {
      const msgFmt = new IntlMessageFormat(simple.en, 'en-US');
      expect(msgFmt.format(maleObj)).to.equal('Tony went to Paris.');
      expect(msgFmt.format(femaleObj)).to.equal('Jenny went to Paris.');
    });

    it('should format message fr-FR simple with different objects', function() {
      const msgFmt = new IntlMessageFormat(simple.fr, 'fr-FR');
      expect(msgFmt.format(maleObj)).to.equal('Tony est allé à Paris.');
      expect(msgFmt.format(femaleObj)).to.equal('Jenny est allée à Paris.');
    });

    it('should format message en-US complex with different objects', function() {
      const msgFmt = new IntlMessageFormat(complex.en, 'en-US');
      expect(msgFmt.format(maleTravelers)).to.equal(
        'Lucas, Tony and Drew went to Paris.'
      );
      expect(msgFmt.format(femaleTravelers)).to.equal('Monica went to Paris.');
    });

    it('should format message fr-FR complex with different objects', function() {
      const msgFmt = new IntlMessageFormat(complex.fr, 'fr-FR');
      expect(msgFmt.format(maleTravelers)).to.equal(
        'Lucas, Tony and Drew sont allés à Paris.'
      );
      expect(msgFmt.format(femaleTravelers)).to.equal(
        'Monica est allée à Paris.'
      );
    });
  });

  describe('and change the locale with different counts', function() {
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

    it('should format a message with en-US locale', function() {
      const msgFmt = new IntlMessageFormat(messages.en, 'en-US');

      expect(msgFmt.format({COMPANY_COUNT: 0})).to.equal(
        '0 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 1})).to.equal(
        'One company published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 2})).to.equal(
        '2 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 5})).to.equal(
        '5 companies published new books.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 10})).to.equal(
        '10 companies published new books.'
      );
    });

    it('should format a message with ru-RU locale', function() {
      const msgFmt = new IntlMessageFormat(messages.ru, 'ru-RU');

      expect(msgFmt.format({COMPANY_COUNT: 0})).to.equal(
        '0 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 1})).to.equal(
        'Одна компания опубликовала новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 2})).to.equal(
        '2 компании опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 5})).to.equal(
        '5 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 10})).to.equal(
        '10 компаний опубликовали новые книги.'
      );
      expect(msgFmt.format({COMPANY_COUNT: 21})).to.equal(
        '21 компания опубликовала новые книги.'
      );
    });
  });

  describe('arguments with', function() {
    describe('no spaces', function() {
      const msg = new IntlMessageFormat('{STATE}'),
        state = 'Missouri';

      it('should fail when the argument in the pattern is not provided', function() {
        expect(msg.format).to.throw(
          Error,
          /The intl string context variable "STATE" was not provided to the string "{STATE}"/
        );
      });

      it('should fail when the argument in the pattern has a typo', function() {
        function formatWithValueNameTypo() {
          return msg.format({'ST ATE': state});
        }

        expect(formatWithValueNameTypo).to.throw(
          Error,
          /The intl string context variable "STATE" was not provided to the string "{STATE}"/
        );
      });

      it('should succeed when the argument is correct', function() {
        expect(msg.format({STATE: state})).to.equal(state);
      });
    });

    describe('a numeral', function() {
      const msg = new IntlMessageFormat('{ST1ATE}');
      const state = 'Missouri';

      it('should fail when the argument in the pattern is not provided', function() {
        function formatWithMissingValue() {
          return msg.format({FOO: state});
        }

        expect(formatWithMissingValue).to.throw(
          Error,
          /The intl string context variable "ST1ATE" was not provided to the string "{ST1ATE}"/
        );
      });

      it('should fail when the argument in the pattern has a typo', function() {
        function formatWithMissingValue() {
          msg.format({'ST ATE': state});
        }

        expect(formatWithMissingValue).to.throw(
          Error,
          /The intl string context variable "ST1ATE" was not provided to the string "{ST1ATE}"/
        );
      });

      it('should succeed when the argument is correct', function() {
        expect(msg.format({ST1ATE: state})).to.equal(state);
      });
    });
  });

  describe('selectordinal arguments', function() {
    const msg =
      'This is my {year, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} birthday.';

    it('should parse without errors', function() {
      expect(() => IntlMessageFormat.__parse!(msg)).to.not.throw();
    });

    it('should use ordinal pluralization rules', function() {
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.format({year: 1})).to.equal('This is my 1st birthday.');
      expect(mf.format({year: 2})).to.equal('This is my 2nd birthday.');
      expect(mf.format({year: 3})).to.equal('This is my 3rd birthday.');
      expect(mf.format({year: 4})).to.equal('This is my 4th birthday.');
      expect(mf.format({year: 11})).to.equal('This is my 11th birthday.');
      expect(mf.format({year: 21})).to.equal('This is my 21st birthday.');
      expect(mf.format({year: 22})).to.equal('This is my 22nd birthday.');
      expect(mf.format({year: 33})).to.equal('This is my 33rd birthday.');
      expect(mf.format({year: 44})).to.equal('This is my 44th birthday.');
      expect(mf.format({year: 1024})).to.equal('This is my 1,024th birthday.');
    });
  });

  describe('exceptions', function() {
    it('should use the correct PT plural rules', function() {
      const msg = '{num, plural, one{one} other{other}}';
      const pt = new IntlMessageFormat(msg, 'pt');
      const ptMZ = new IntlMessageFormat(msg, 'pt-MZ');

      expect(pt.format({num: 0})).to.equal('one');
      // According to https://github.com/unicode-cldr/cldr-core/blob/master/supplemental/plurals.json#L599-L606
      expect(ptMZ.format({num: 0})).to.equal('one');
      expect(ptMZ.format({num: 100})).to.equal('other');
    });

    it('should take negative number as plural', function() {
      const msg =
        '{num, plural, offset:-1 =-1{negative one} one{one} other{other}}';
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.format({num: -1})).to.equal('negative one');
      expect(mf.format({num: 0})).to.equal('one');
      expect(mf.format({num: 1})).to.equal('other');
    });
    it('should take empty string value', function() {
      const msg = '"{value}"';
      const mf = new IntlMessageFormat(msg, 'en');

      expect(mf.formatToParts({value: ''})).to.deep.equal([
        {type: PART_TYPE.literal, value: '"'},
        {type: PART_TYPE.argument, value: ''},
        {type: PART_TYPE.literal, value: '"'},
      ]);
      expect(mf.formatHTMLMessage({value: ''})).to.deep.equal(['""']);
      expect(mf.format({value: ''})).to.equal('""');
    });
  });

  it('should handle offset in plural #', function() {
    const msg = `{num_guests, plural, offset:1
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to their party.}
      =2 {{host} invites {guest} and one other person to their party.}
      other {{host} invites {guest} and # other people to their party.}
    }`;
    const mf = new IntlMessageFormat(msg, 'en');
    expect(
      mf.format({host: 'The host', guest: 'Alice', num_guests: 0})
    ).to.equal('The host does not give a party.');
    expect(
      mf.format({host: 'The host', guest: 'Alice', num_guests: 1})
    ).to.equal('The host invites Alice to their party.');
    expect(
      mf.format({host: 'The host', guest: 'Alice', num_guests: 2})
    ).to.equal('The host invites Alice and one other person to their party.');
    expect(
      mf.format({host: 'The host', guest: 'Alice', num_guests: 3})
    ).to.equal('The host invites Alice and 2 other people to their party.');
  });

  it('regression issue #437', function() {
    const mf = new IntlMessageFormat(
      '{score, plural, one {# shopper} other {# shoppers}}',
      'en'
    );
    expect(mf.format({score: 1})).to.equal('1 shopper');
    expect(mf.format({score: 2})).to.equal('2 shoppers');
  });

  describe('xml', function() {
    it('should handle @ correctly', function() {
      const mf = new IntlMessageFormat('hi @{there}', 'en');
      expect(
        mf.formatHTMLMessage({
          there: '2008',
        })
      ).to.deep.equal(['hi @2008']);
    });

    it('simple message', function() {
      const mf = new IntlMessageFormat('hello <b>world</b>', 'en');
      expect(mf.formatHTMLMessage({b: str => ({str})})).to.deep.equal([
        'hello ',
        {str: 'world'},
      ]);
    });
    it('nested tag message', function() {
      const mf = new IntlMessageFormat(
        'hello <b>world<i>!</i> <br/> </b>',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          b: (...chunks) => ({chunks}),
          i: c => ({val: `$$${c}$$`}),
        })
      ).to.deep.equal([
        'hello ',
        {chunks: ['world', {val: '$$!$$'}, ' ', '<br>', ' ']},
      ]);
    });
    it('deep format nested tag message', function() {
      const mf = new IntlMessageFormat(
        'hello <b>world<i>!</i> <br/> </b>',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          i: c => ({val: `$$${c}$$`}),
        })
      ).to.deep.equal([
        'hello ',
        '<b>',
        'world',
        {val: '$$!$$'},
        ' ',
        '<br>',
        ' ',
        '</b>',
      ]);
    });
    it('handle no child tags', function() {
      const mf = new IntlMessageFormat('hello <br> <foo></foo> <i>!</i>', 'en');
      expect(
        mf.formatHTMLMessage({
          i: c => ({val: `$$${c}$$`}),
        })
      ).to.deep.equal([
        'hello ',
        '<br>',
        ' ',
        '<foo></foo>',
        ' ',
        {val: '$$!$$'},
      ]);
    });
    it('should throw if void elements are used', function() {
      const mf = new IntlMessageFormat('hello <img/>', 'en');
      expect(() => mf.formatHTMLMessage({img: str => ({str})})).to.throw(
        /img is a self-closing tag and can not be used/
      );
    });
    it('simple message w/ placeholder and no tag', function() {
      const mf = new IntlMessageFormat('hello {placeholder} {var2}', 'en');
      expect(
        mf.formatHTMLMessage({
          placeholder: {name: 'gaga'},
          var2: {foo: 1},
        })
      ).to.deep.equal(['hello ', {name: 'gaga'}, ' ', {foo: 1}]);
    });
    it('simple message w/ placeholder', function() {
      const mf = new IntlMessageFormat(
        'hello <b>world</b> <a>{placeholder}</a>',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          b: str => ({str}),
          placeholder: 'gaga',
          a: str => ({str}),
        })
      ).to.deep.equal(['hello ', {str: 'world'}, ' ', {str: 'gaga'}]);
    });
    it('message w/ placeholder & HTML entities', function() {
      const mf = new IntlMessageFormat('Hello&lt;<tag>{text}</tag>', 'en');
      expect(
        mf.formatHTMLMessage({
          tag: str => ({str}),
          text: '<asd>',
        })
      ).to.deep.equal(['Hello<', {str: '<asd>'}]);
    });
    it('message w/ placeholder & >', function() {
      const mf = new IntlMessageFormat(
        '&lt; hello <b>world</b> {token} &lt;&gt; <a>{placeholder}</a>',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          b: str => ({str}),
          token: '<asd>',
          placeholder: '>',
          a: str => ({str}),
        })
      ).to.deep.equal(['< hello ', {str: 'world'}, ' <asd> <> ', {str: '>'}]);
    });
    it('select message w/ placeholder & >', function() {
      const mf = new IntlMessageFormat(
        '{gender, select, male {&lt; hello <b>world</b> {token} &lt;&gt; <a>{placeholder}</a>} female {<b>foo &lt;&gt; bar</b>}}',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          gender: 'male',
          b: str => ({str}),
          token: '<asd>',
          placeholder: '>',
          a: str => ({str}),
        })
      ).to.deep.equal(['< hello ', {str: 'world'}, ' <asd> <> ', {str: '>'}]);
      expect(
        mf.formatHTMLMessage({
          gender: 'female',
          b: str => ({str}),
        })
      ).to.deep.equal([{str: 'foo <> bar'}]);
    });
    it('should treat tag as legacy HTML if no value is provided', function() {
      const mf = new IntlMessageFormat(
        'hello <b>world</b> <a>{placeholder}</a>',
        'en'
      );
      expect(
        mf.formatHTMLMessage({
          placeholder: '<foo>gaga</foo>',
        })
      ).to.deep.equal(['hello <b>world</b> <a><foo>gaga</foo></a>']);
    });
    it('should handle tag w/ rich text', function() {
      const mf = new IntlMessageFormat('hello <foo>{bar}</foo> test', 'en');
      expect(
        mf.formatHTMLMessage({
          foo: obj => ({
            obj,
          }),
          bar: {bar: 1},
        })
      ).to.deep.equal(['hello ', {obj: {bar: 1}}, ' test']);
    });
  });

  it('custom formats should work for time', function() {
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
    expect(mf.format({time: new Date(0)})).to.include(
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

  it('custom formats should work for date', function() {
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
    expect(mf.format({time: 0})).to.include(
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

  it('custom formats should work for number', function() {
    const msg = 'Today is {time, number, verbose}';
    const mf = new IntlMessageFormat(msg, 'en', {
      number: {
        verbose: {
          minimumFractionDigits: 5,
          maximumFractionDigits: 5,
        },
      },
    });
    expect(mf.format({time: 0.1234567})).to.include(
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
      expect(mf.format({count: 1})).to.equal('You worked for 1 hour today.');
      expect(mf.format({count: 3})).to.equal('You worked for 3 hours today.');
    });

    it('preserves quoted # symbol in the plural option', () => {
      const mf = new IntlMessageFormat(
        "You {count, plural, one {worked for '#' hour} other {worked for '#' hours}} today.",
        'en'
      );
      expect(mf.format({count: 1})).to.equal('You worked for # hour today.');
      expect(mf.format({count: 3})).to.equal('You worked for # hours today.');
    });

    it('does not format # symbol in the plural option as a standalone part', () => {
      const mf = new IntlMessageFormat(
        'You {count, plural, one {worked for # hour} other {worked for # hours}} today.',
        'en'
      );
      expect(mf.formatToParts({count: 1})).to.deep.equal([
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
      expect(mf.format({count: 1, unit: 'hour'})).to.equal(
        'You worked for # hour today.'
      );
      expect(mf.format({count: 3, unit: 'hour'})).to.equal(
        'You worked for # hours today.'
      );
    });
  });

  describe('number skeleton', function() {
    expect(
      new IntlMessageFormat(
        '{amount, number, ::currency/CAD .0 group-off}',
        'en-US'
      ).format({amount: 123456.78})
    ).to.equal('CA$123456.8');
    expect(
      new IntlMessageFormat(
        '{amount, number, ::currency/GBP .0#}',
        'en-US'
      ).format({amount: 123456.789})
    ).to.equal('£123,456.79');
  });

  describe('formatToParts', function() {
    it('should be able to take React Element', function() {
      const element = {};
      const parts = new IntlMessageFormat(
        'a react {element}',
        'en'
      ).formatToParts({
        element,
      });
      expect(parts).to.deep.equal([
        {type: PART_TYPE.literal, value: 'a react '},
        {type: PART_TYPE.argument, value: element},
      ]);
    });
  });

  describe('no locale', function() {
    describe('no locale provided', function() {
      it('should default to English', function() {
        const msg = new IntlMessageFormat(
          'I have {NUM_BOOKS, plural, =1 {1 book} other {# books}}.'
        );
        expect(msg.resolvedOptions().locale).to.equal(
          new Intl.NumberFormat().resolvedOptions().locale
        );
        expect(msg.format({NUM_BOOKS: 2})).to.equal('I have 2 books.');
      });
    });

    describe('invalid locale default', function() {
      it('should fallback to default locale', function() {
        const msg = new IntlMessageFormat(
          '{COMPANY_COUNT, plural, =1 {One company} other {# companies}} published new books.',
          'fu-BA'
        );
        const m = msg.format({COMPANY_COUNT: 1});

        expect(m).to.equal('One company published new books.');
      });
    });
  });
});

describe('intl-format-cache', function() {
  const getMessageFormat = memoizeFormatConstructor(IntlMessageFormat);

  it('memoizes IntlMessageFormat', function() {
    const mf = getMessageFormat('foo', 'en');

    expect(mf.resolvedOptions().locale).to.equal('en');
    expect(mf.format()).to.equal('foo');

    expect(getMessageFormat('foo', 'en')).to.equal(mf);
    expect(getMessageFormat('bar', 'en')).not.to.equal(mf);
  });
});
