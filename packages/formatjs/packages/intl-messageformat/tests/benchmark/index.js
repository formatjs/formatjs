/* global Intl */
'use strict';

global.Intl || (global.Intl = require('intl'));

var Benchmark         = require('benchmark'),
    IntlMessageFormat = require('../../index.js');

require('../../locale-data/en');

var suiteConfig = {
    onStart: function (e) {
        console.log(e.currentTarget.name + ':');
    },

    onCycle: function (e) {
        console.log(String(e.target));
    },

    onComplete: function () {
        console.log('');
    }
};

var now = new Date();

var mf     = new IntlMessageFormat('foo {bar}', 'en-US'),
    mfNum  = new IntlMessageFormat('foo {bar, number, integer}', 'en-US'),
    mfDate = new IntlMessageFormat('foo {bar, date, medium}', 'en-US');

var mfComplex = new IntlMessageFormat('{name} has {numMessages, plural, one {unread message} other {many unread messages}}', 'en-US');

new Benchmark.Suite('IntlMessageFormat', suiteConfig)
    .add('new IntlMessageFormat', function () {
        new IntlMessageFormat('foo {bar}', 'en-US');
    })
    .add('new IntlMessageFormat#format()', function () {
        new IntlMessageFormat('foo {bar}', 'en-US').format({bar: 'BAR'});
    })
    .add('cached IntlMessageFormat#format()', function () {
        mf.format({bar: 'BAR'});
    })
    .add('cached with number IntlMessageFormat#format()', function () {
        mfNum.format({bar: 1000});
    })
    .add('cached with date IntlMessageFormat#format()', function () {
        mfDate.format({bar: now});
    })
    .add('cached with complex IntlMessageFormat#format()', function () {
        mfComplex.format({
            name       : 'Eric',
            numMessages: 1000
        });
    })
    .run();
