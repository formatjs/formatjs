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

    mockery = require('mockery'),

    IntlMessageFormat;

mockery.enable({
    useCleanCache:      true,
    warnOnReplace:      false,
    warnOnUnregistered: false
});


IntlMessageFormat = require('../index.js');


describe('no locale', function () {

    describe('no locale provided', function () {

        before(function () {
            mockery.resetCache();
            IntlMessageFormat = require('../index.js');
        });

        it('no locale', function () {
            try {
                var msg = new IntlMessageFormat(['I have ', {
                    type: 'plural',
                    valueName: 'NUM_BOOKS',
                    options: {
                        one: '1 book',
                        other: '${#} books'
                    }
                }, '.']);

                var m = msg.format({ NUM_BOOKS: 2 });

                // always fail if we didn't throw
                expect(false).to.equal(true);

            } catch (e) {
                var err = new ReferenceError('No locale data has been provided for this object yet.');
                expect(e.toString()).to.equal(err.toString());
            }
        });
    });


    describe('no default', function () {

        it('blind switching', function () {
            var msg = new IntlMessageFormat([{
                        type: 'plural',
                        valueName: 'COMPANY_COUNT',
                        options: {
                           one: 'One company',
                           other: '${#} companies'
                        }
                    },
                    ' published new books.'
                ]);

            // let's set the locale to something witout data
            IntlMessageFormat.__addLocaleData({locale: 'fu-baz'});
            msg.locale = 'fu-baz';

            var m = msg.format({ COMPANY_COUNT: 1});

            expect(m).to.equal('1 companies published new books.');
        });

    });

    describe('no default', function () {

        it('update locale', function () {
            // let's set the locale to something witout data
            IntlMessageFormat.__addLocaleData({
                locale: 'fu-baz',
                messageformat: {
                    pluralFunction: function (count) { return null; }
                }
            });

            var msg = new IntlMessageFormat([{
                        type: 'plural',
                        valueName: 'COMPANY_COUNT',
                        options: {
                           one: 'One company',
                           other: '${#} companies'
                        }
                    },
                    ' published new books.'
                ]);

            var m = msg.format({ COMPANY_COUNT: 1});

            expect(m).to.equal('1 companies published new books.');
        });
    });
});

