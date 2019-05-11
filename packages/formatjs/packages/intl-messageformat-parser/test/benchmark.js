#!/usr/bin/env node
'use strict';
const benchmark = require('benchmark')
var parser = require('../');

const complexMsg = '' +
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

const normalMsg = '' +
          'Yo, {firstName} {lastName} has ' +
          '{numBooks, number, integer} ' +
          '{numBooks, plural, ' +
              'one {book} ' +
              'other {books}}.';
              
const simpleMsg = 'Hello, {name}!';

const stringMsg = 'Hello, world!';

new benchmark.Suite()
.add('complex_msg', () => parser.parse(complexMsg))
.add('normal_msg', () => parser.parse(normalMsg))
.add('simple_msg', () => parser.parse(simpleMsg))
.add('string_msg', () => parser.parse(stringMsg))
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run()
