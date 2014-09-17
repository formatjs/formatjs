/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe, it, before */

'use strict';

var chai = require('chai'),
    expect = chai.expect,
    IntlMessageFormat = require('../');

describe('no locale', function () {

    describe('no locale provided', function () {

        it('should default to English', function () {
            var msg = new IntlMessageFormat('I have {NUM_BOOKS, plural, =1 {1 book} other {# books}}.');
            expect(msg.resolvedOptions().locale).to.equal('en');
            expect(msg.format({ NUM_BOOKS: 2 })).to.equal('I have 2 books.');
        });
    });

    describe('invalid locale default', function () {

        it('should fallback to default locale', function () {
            // let's set the locale to something witout data
            IntlMessageFormat.__addLocaleData({
                locale: 'fu-baz',
                pluralRuleFunction: function (count) { return null; }
            });

            var msg = new IntlMessageFormat('{COMPANY_COUNT, plural, =1 {One company} other {# companies}} published new books.');
            var m = msg.format({ COMPANY_COUNT: 1});

            expect(m).to.equal('One company published new books.');
        });
    });
});
