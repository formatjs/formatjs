#!/usr/bin/env node
'use strict';
const benchmark = require('benchmark');
const {parse} = require('./dist/index');
const baselineParse = require('intl-messageformat-parser').parse;

const complexMsg =
    '' +
    '{gender_of_host, select, ' +
    'female {' +
    '{num_guests, plural, offset:1 ' +
    '=0 {{host} does not give a party.}' +
    '=1 {{host} invites <em>{guest}</em> to her party.}' +
    '=2 {{host} invites <em>{guest}</em> and <em>one</em> other person to her party.}' +
    'other {{host} invites <em>{guest}</em> and <em>#</em> other people to her party.}}}' +
    'male {' +
    '{num_guests, plural, offset:1 ' +
    '=0 {{host} does not give a party.}' +
    '=1 {{host} invites <em>{guest}</em> to his party.}' +
    '=2 {{host} invites <em>{guest}</em> and one other person to his party.}' +
    'other {{host} invites <em>{guest}</em> and <em>#</em> other people to his party.}}}' +
    'other {' +
    '{num_guests, plural, offset:1 ' +
    '=0 {{host} does not give a party.}' +
    '=1 {{host} invites <em>{guest}</em> to their party.}' +
    '=2 {{host} invites <em>{guest}</em> and one other person to their party.}' +
    'other {{host} invites <em>{guest}</em> and <em>#</em> other people to their party.}}}}';

const normalMsg =
    '' +
    'Yo, {firstName} {lastName} has ' +
    '{numBooks, number, integer} ' +
    '{numBooks, plural, ' +
    'one {book} ' +
    'other {books}}.';

const simpleMsg = 'Hello, {name}!';

const stringMsg = 'Hello, world!';

console.log('complex_msg AST length', JSON.stringify(parse(complexMsg)).length);
console.log('normal_msg AST length', JSON.stringify(parse(normalMsg)).length);
console.log('simple_msg AST length', JSON.stringify(parse(simpleMsg)).length);
console.log('string_msg AST length', JSON.stringify(parse(stringMsg)).length);

function run(parse) {
    new benchmark.Suite()
        .add('complex_msg', () => parse(complexMsg))
        .add('normal_msg', () => parse(normalMsg))
        .add('simple_msg', () => parse(simpleMsg))
        .add('string_msg', () => parse(stringMsg))
        .on('cycle', function (event) {
            console.log(String(event.target));
        })
        .run();
}

console.log();
console.log('== Baseline ==');
run(baselineParse);
console.log();
console.log('== This package ==');
run(parse);
