import {Suite, Event} from 'benchmark';
import IntlMessageFormat, {Formatters} from '../src';
import '@formatjs/intl-pluralrules/polyfill-locales';
import memoize from 'intl-format-cache';

const msg =
  '' +
  '{gender_of_host, select, ' +
  'female {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to her party.}' +
  '=2 {{host} invites {guest} and one other person to her party.}' +
  'other {{host} invites {guest} and {num_guests,number} other people to her party.}}}' +
  'male {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to his party.}' +
  '=2 {{host} invites {guest} and one other person to his party.}' +
  'other {{host} invites {guest} and {num_guests,number} other people to his party.}}}' +
  'other {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to their party.}' +
  '=2 {{host} invites {guest} and one other person to their party.}' +
  'other {{host} invites {guest} and {num_guests,number} other people to their party.}}}}';

const mf = new IntlMessageFormat(msg, 'en-US');
const stringMsg = 'Hello, world!';
const stringMf = new IntlMessageFormat(stringMsg, 'en-US');

const preparsedMsg = IntlMessageFormat.__parse!(msg);

const formatters: Formatters = {
  getNumberFormat: memoize(Intl.NumberFormat),
  getDateTimeFormat: memoize(Intl.DateTimeFormat),
  getPluralRules: memoize(Intl.PluralRules),
};

new Suite()
  .add('format_cached_complex_msg', () =>
    mf.format({
      gender_of_host: 'male',
      num_guests: 10,
      host: 'Eric',
      guest: 'Caridy',
    })
  )
  .add('format_cached_string_msg', () => stringMf.format())
  .add(
    'new_complex_msg_preparsed',
    () => new IntlMessageFormat(preparsedMsg, 'en-US')
  )
  .add('new_complex_msg', () => new IntlMessageFormat(msg, 'en-US'))
  .add('new_string_msg', () => new IntlMessageFormat(stringMsg, 'en-US'))
  .add('complex msg format', () =>
    new IntlMessageFormat(msg, 'en-US').format({
      gender_of_host: 'male',
      num_guests: 2,
      host: 'foo',
      guest: 'bar',
    })
  )
  .add('complex msg w/ formatters format', () =>
    new IntlMessageFormat(msg, 'en-US', undefined, {formatters}).format({
      gender_of_host: 'male',
      num_guests: 2,
      host: 'foo',
      guest: 'bar',
    })
  )
  .add('complex preparsed msg w/ formatters format', () =>
    new IntlMessageFormat(preparsedMsg, 'en-US', undefined, {
      formatters,
    }).format({
      gender_of_host: 'male',
      num_guests: 2,
      host: 'foo',
      guest: 'bar',
    })
  )
  .add('complex preparsed msg w/ new formatters format', () =>
    new IntlMessageFormat(preparsedMsg, 'en-US', undefined, {
      formatters: {
        getNumberFormat: formatters.getNumberFormat,
        getDateTimeFormat: formatters.getDateTimeFormat,
        getPluralRules: formatters.getPluralRules,
      },
    }).format({
      gender_of_host: 'male',
      num_guests: 2,
      host: 'foo',
      guest: 'bar',
    })
  )
  .on('error', function(event: Event) {
    console.log(String(event.target));
  })
  .on('cycle', function(event: Event) {
    console.log(String(event.target));
  })
  .run();
