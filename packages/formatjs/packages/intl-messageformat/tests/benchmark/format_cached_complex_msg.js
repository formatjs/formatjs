'use strict';

global.Intl || require('intl');

var IntlMessageFormat = require('../../');

var msg = '' +
    '{gender_of_host, select, ' +
      'female {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to her party.}' +
          '=2 {{host} invites {guest} and one other person to her party.}' +
          'other {{host} invites {guest} and # other people to her party.}}}' +
      'male {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to his party.}' +
          '=2 {{host} invites {guest} and one other person to his party.}' +
          'other {{host} invites {guest} and # other people to his party.}}}' +
      'other {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to their party.}' +
          '=2 {{host} invites {guest} and one other person to their party.}' +
          'other {{host} invites {guest} and # other people to their party.}}}}';

var mf = new IntlMessageFormat(msg, 'en-US');

module.exports = function () {
    mf.format({
        gender_of_host: 'male',
        num_guests    : 10,
        host          : 'Eric',
        guest         : 'Caridy'
    });
};
