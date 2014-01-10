/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it,beforeEach */
'use strict';


var chai,
    expect,
    IntlMessageFormat;


// This oddity is so that this file can be used for both client-side and
// server-side testing.  (On the client we've already loaded chai and
// IntlMessageFormat.)
if ('function' === typeof require) {

    chai = require('chai');

    IntlMessageFormat = require('../index.js');

    require('../locale-data/en.js');
    require('../locale-data/ar.js');
    require('../locale-data/pl.js');

}
expect = chai.expect;


describe('IntlMessageFormat', function () {

    it('should be a function', function () {
        expect(IntlMessageFormat).to.be.a('function');
    });

    // PROTOTYPE
    describe('.__addLocaleData( [obj] )', function () {
        it('should respond to .__addLocaleData()', function () {
            expect(IntlMessageFormat).itself.to.respondTo('__addLocaleData');
        });
    });

    // CONSTRUCTOR PROPERTIES

    describe('#locale', function () {
        var msgFmt;

        it('should be null', function () {
            msgFmt = new IntlMessageFormat();
            /*jshint expr:true */
            expect(msgFmt.locale).to.be.null;
        });

        it('should be equal to the second parameter', function () {
            msgFmt = new IntlMessageFormat(null, 'en-US');
            expect(msgFmt.locale).to.equal('en-US');
        });

        it('should throw an error if the second parameter is a space', function () {
            try {
                msgFmt = new IntlMessageFormat(null, ' ');
                // should not get here
                expect(false, 'IntlMessageFormat should have thrown').to.equal(true);
            } catch (e) {
                var err = new RangeError('Invalid language tag.');
                expect(e.toString()).to.equal(err.toString());
            }
        });

    });

    describe('#_pluralLocale', function () {
        var msgFmt = new IntlMessageFormat();

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralLocale).to.be.undefined;
        });
    });

    describe('#_pluralFunc', function () {
        var msgFmt = new IntlMessageFormat();

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralFunc).to.be.undefined;
        });
    });

    describe('#pattern', function () {
        it('should be undefined', function () {
            var msgFmt = new IntlMessageFormat();
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.exist;
        });

        it('should be undefined when first parameter is ommited', function () {
            var msgFmt = new IntlMessageFormat();
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.exist;
        });

        it('should match the first parameter when it is an array', function () {
            var msgFmt = new IntlMessageFormat(['My name is ', { valueName: 'NAME' }]);

            expect(msgFmt.pattern).to.be.an('array');
            expect(msgFmt.pattern.length).to.equal(2);
            expect(msgFmt.pattern[0]).to.equal('My name is ');
            expect(msgFmt.pattern[1]).to.be.an('object');
            /*jshint expr:true */
            expect(msgFmt.pattern[1].valueName).to.exist;
            expect(msgFmt.pattern[1].valueName).to.equal('NAME');
        });

        it('should match the first parameter parsed into an array when it is a string', function () {
            var msgFmt = new IntlMessageFormat('My name is ${NAME}');

            expect(msgFmt.pattern).to.be.an('array');
            expect(msgFmt.pattern.length).to.equal(2);
            expect(msgFmt.pattern[0]).to.equal('My name is ');
            expect(msgFmt.pattern[1]).to.be.an('object');
            /*jshint expr:true */
            expect(msgFmt.pattern[1].valueName).to.exist;
            expect(msgFmt.pattern[1].valueName).to.equal('NAME');
        });

    });

    describe('#formatters', function () {
        it('should be an empty object without a third parameter', function () {
            var msgFmt = new IntlMessageFormat(),
                p, pCount = 0;

            expect(msgFmt.formatters).to.be.an('object');

            for (p in msgFmt.formatters) {
                if (msgFmt.formatters.hasOwnProperty(p)) {
                    pCount++;
                }
            }

            expect(pCount).to.equal(0);
        });

        it('should only contain formatter functions from the third parameter', function () {
            var msgFmt = new IntlMessageFormat(null, null, {
                'num': 3,
                'str': 'foo',
                'fn' : function () { }
            }),

            formatters = msgFmt.formatters;

            /*jshint expr:true */
            expect(formatters.fn).to.exist;
            /*jshint expr:true */
            expect(formatters.num).to.not.exist;
            /*jshint expr:true */
            expect(formatters.str).to.not.exist;
        });

    });

    // CONSTRUCTOR METHODS

    describe('#resolvedOptions( )', function () {
        var msgFmt;

        beforeEach(function () {
            msgFmt = new IntlMessageFormat();
        });

        it('should be a function', function () {
            expect(msgFmt.resolvedOptions).to.be.a('function');
            expect(msgFmt).to.respondTo('resolvedOptions');
        });

        it('should return an empty object', function () {
            var p, pCount = 0,
                resolvedOptions;

            resolvedOptions = msgFmt.resolvedOptions();

            for (p in resolvedOptions) {
                if (resolvedOptions.hasOwnProperty(p)) {
                    pCount++;
                }
            }

            expect(pCount).to.equal(0);
        });
    });

    describe('#format( [object] )', function () {
        var msgFmt;

        it('should be a function', function () {
            msgFmt = new IntlMessageFormat();
            expect(msgFmt.format).to.be.a('function');
            expect(msgFmt).to.respondTo('format');
        });

        it('should return a string', function () {
            msgFmt = new IntlMessageFormat();
            expect(msgFmt.format()).to.be.a('string');
        });

    });

    describe('using a string pattern', function () {

        it('should fail if there is no argument in the string', function () {
            try {
                var msgFmt = new IntlMessageFormat('My name is {FIRST LAST}');

                // should never reach here
                expect(false, 'IntlMessageFormat should have thrown').to.equal(true);
            } catch (e) {
                var err = new RangeError('No tokens were provided.');
                expect(err.toString()).to.equal(e.toString());
            }
        });

        it('should properly replace direct arguments in the string', function () {
            var msgFmt = new IntlMessageFormat('My name is {FIRST} {LAST}.'),
                m = msgFmt.format({
                    FIRST: 'Anthony',
                    LAST : 'Pipkin'
                });

            expect(m).to.be.a('string');
            expect(m).to.equal('My name is Anthony Pipkin.');
        });

        it('should properly replace direct arguments in the string preceeding with a $', function () {
            var msgFmt = new IntlMessageFormat('My name is ${FIRST} ${LAST}.'),
                m = msgFmt.format({
                    FIRST: 'Anthony',
                    LAST : 'Pipkin'
                });

            expect(m).to.be.a('string');
            expect(m).to.equal('My name is Anthony Pipkin.');
        });

        it('should process an argument with a value formatter', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat('Test formatter d: ${num:d}', null, {
                    d: function (val, locale) {
                        return +val;
                    }
                }, 'en-US');

            m = msgFmt.format({
                num: '010'
            });

            expect(m).to.equal('Test formatter d: 10');
        });

        it('should not fail if the formatter is non existant', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat('Test formatter foo: ${NUM:foo}', null, {
                    d: function (val, locale) {
                        return +val;
                    }
                }, 'en-US');

            m = msgFmt.format({
                NUM: '010'
            });

            expect(m).to.equal('Test formatter foo: 010');
        });

        it('should not process inherited formatters', function () {
            var msg, m,
                Formatters = function () {
                    this.d = function (val, locale) {
                        return val + '030';
                    };
                },
                CustomFormatters = function () {
                    this.f = function (val, locale) {
                        return val + '080';
                    };
                };

            CustomFormatters.prototype = Formatters;
            CustomFormatters.prototype.constructor = CustomFormatters;


            msg = new IntlMessageFormat('d: ${num:d} / f: ${num:f}', 'en-US', new CustomFormatters());

            m = msg.format({
                num: 0
            });

            expect(m).to.equal('d: 0 / f: 0080');
        });

        it('should work when the pattern is replaced', function () {
           var msg, m;

            msg = new IntlMessageFormat('${NAME} ${FORMULA}', 'en-US');

            msg.pattern = '${FORMULA} ${NAME}';

            m = msg.format({
                NAME: 'apipkin'
            });

            expect(m).to.equal('${FORMULA} apipkin');

        });

    });

    describe('using an Array pattern', function () {
        it('should concatenate the Array', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat(['I have ', 2, ' cars.']);

            m = msgFmt.format();

            expect(m).to.equal('I have 2 cars.');
        });

        it ('should throw an error if the format object does not contain an argument that is replaced' , function () {
            try {
                var msgFmt = new IntlMessageFormat(['I have ', { valueName: 'COLOR' }, ' cars.'], 'en-US'),

                    m = msgFmt.format({
                        color: 'blue'
                    });

                // should not get here
                expect(false, 'IntlMessageFormat should have thrown').to.equal(true);

            } catch (e) {
                var err = new ReferenceError('The valueName `COLOR` was not found.');
                expect(e.toString()).to.equal(err.toString());
            }
        });

        it('should concatenate an Array and process arguments afterwards', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat(['${', 'company', '}', ' {', 'verb' ,'}.']);

            m = msgFmt.format({
                company: 'Yahoo',
                verb: 'rocks'
            });

            expect(m).to.equal('Yahoo rocks.');
        });

        it ('should process plural argument types', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat(['Some text before ', {
                    type: 'plural',
                    valueName: 'NUM_PEOPLE',
                    options: {
                        one: 'one',

                        few: 'few',

                        other: 'Some messages for the default'
                    }
                }, ' and text after']);

            m = msgFmt.format({
                NUM_PEOPLE: 20
            });

            expect(m).to.equal("Some text before Some messages for the default and text after");
        });

        it('should process a plural argument type with an offset value', function () {
            var msgFmt, m;
            msgFmt = new IntlMessageFormat(['Some text before ', {
                    type: 'plural',
                    valueName: 'NUM_PEOPLE',
                    offset: 1,
                    options: {
                        one: 'one',

                        few: 'few',

                        other: 'Some messages for the default'
                    }
                }, ' and text after'],
                    'pl'    // this has the "few" rule that we need
                );

            m = msgFmt.format({
                NUM_PEOPLE: 1   // offset will move this to "2" so that the "few" group is used
            });

            expect(m).to.equal("Some text before few and text after");
        });

        it('should process an argument with a value formatter provided in an argument object', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat([{
                    valueName: 'ANIMAL',
                    formatter: function (val, locale) {
                        return val.toString().split('').reverse().join('');
                    }
                }], 'en-US');

            m = msgFmt.format({
                ANIMAL: 'aardvark'
            });

            expect(m).to.equal('kravdraa');
        });
    });

    describe('and plurals under the Arabic locale', function () {
        var msgFmt = new IntlMessageFormat(['I have ', {
                type: 'plural',
                valueName: 'numPeople',
                options: {
                    zero : 'zero points',
                    one  : 'a point',
                    two  : 'two points',
                    few  : 'a few points',
                    many : 'lots of points',
                    other: 'some other amount of points'
                }
            }, '.'], 'ar');

        it('should match zero', function () {
            var m = msgFmt.format({
                numPeople: 0
            });

            expect(m).to.equal('I have zero points.');
        });

        it('should match one', function () {
            var m = msgFmt.format({
                numPeople: 1
            });

            expect(m).to.equal('I have a point.');
        });

        it('should match two', function () {
            var m = msgFmt.format({
                numPeople: 2
            });

            expect(m).to.equal('I have two points.');
        });

        it('should match few', function () {
            var m = msgFmt.format({
                numPeople: 5
            });

            expect(m).to.equal('I have a few points.');
        });

        it('should match many', function () {
            var m = msgFmt.format({
                numPeople: 20
            });

            expect(m).to.equal('I have lots of points.');
        });

        it('should match other', function () {
            var m = msgFmt.format({
                numPeople: 100
            });

            expect(m).to.equal('I have some other amount of points.');
        });
    });

    describe('and changing the locale', function () {
        var simple = {
                en: [
                    { valueName: 'NAME' },
                    ' went to ',
                    { valueName: 'CITY' },
                    '.'
                ],

                fr: [
                    { valueName: 'NAME' },
                    ' est ',
                    {
                        type: 'gender',
                        valueName: 'GENDER',
                        options: {
                            female: 'allée',
                            other: 'allé'
                        }
                    },
                    ' à ',
                    { valueName: 'CITY' },
                    '.'
                ]
            },

            complex = {
                en: '${TRAVELLERS} went to ${CITY}.',

                fr: [
                    '${TRAVELLERS}',
                    {
                        type: 'plural',
                        valueName: 'TRAVELLER_COUNT',
                        options: {
                            one: [' est ', {
                                type: 'gender',
                                valueName: 'GENDER',
                                options: {
                                    female: 'allée',
                                    other: 'allé'
                                }
                            }],
                            other: [' sont ', {
                                type: 'gender',
                                valueName: 'GENDER',
                                options: {
                                    female: 'allées',
                                    other: 'allés'
                                }
                            }]
                        }
                    },
                    ' à ',
                    '${CITY}',
                    '.'
                ]
            },

            maleObj = {
                NAME: 'Tony',
                CITY: 'Paris',
                GENDER: 'male'
            },
            femaleObj = {
                NAME: 'Jenny',
                CITY: 'Paris',
                GENDER: 'female'
            },

            maleTravelers = {
                TRAVELLERS: 'Lucas, Tony and Drew',
                TRAVELLER_COUNT: 3,
                GENDER: 'male',
                CITY: 'Paris'
            },

            femaleTravelers = {
                TRAVELLERS: 'Monica',
                TRAVELLER_COUNT: 1,
                GENDER: 'female',
                CITY: 'Paris'
            };

        it('should format message en-US simple with different objects', function () {
            var msgFmt = new IntlMessageFormat(simple.en, 'en-US');

            expect(msgFmt.format(maleObj)).to.equal('Tony went to Paris.');

            expect(msgFmt.format(femaleObj)).to.equal('Jenny went to Paris.');
        });


        it('should format message fr-FR simple with different objects', function () {
            var msgFmt = new IntlMessageFormat(simple.fr, 'fr-FR');

            expect(msgFmt.format(maleObj)).to.equal('Tony est allé à Paris.');

            expect(msgFmt.format(femaleObj)).to.equal('Jenny est allée à Paris.');
        });

        it('should format message en-US complex with different objects', function () {
            var msgFmt = new IntlMessageFormat(complex.en, 'en-US');

            expect(msgFmt.format(maleTravelers)).to.equal('Lucas, Tony and Drew went to Paris.');

            expect(msgFmt.format(femaleTravelers)).to.equal('Monica went to Paris.');
        });


        it('should format message fr-FR complex with different objects', function () {
            var msgFmt = new IntlMessageFormat(complex.fr, 'fr-FR');

            expect(msgFmt.format(maleTravelers)).to.equal('Lucas, Tony and Drew sont allés à Paris.');

            expect(msgFmt.format(femaleTravelers)).to.equal('Monica est allée à Paris.');
        });
    });

    describe('and change the locale with different counts', function () {

        var messages = {
                en: [{
                        type: 'plural',
                        valueName: 'COMPANY_COUNT',
                        options: {
                           one: 'One company',
                           other: '${#} companies'
                        }
                    },
                    ' published new books.'
                ],
                ru: [{
                        type: 'plural',
                        valueName: 'COMPANY_COUNT',
                        options: {
                            one: 'Одна компания опубликовала',
                            many: '${#} компаний опубликовали',
                            other: '${#} компаний опубликовали'
                        }
                    },
                    ' новые книги.'
                ]
            };

        it('should format a message with en-US locale', function () {
            var msgFmt = new IntlMessageFormat(messages.en, 'en-US');

            expect(msgFmt.format({COMPANY_COUNT: 0})).to.equal('0 companies published new books.');

            expect(msgFmt.format({COMPANY_COUNT: 1})).to.equal('One company published new books.');

            expect(msgFmt.format({COMPANY_COUNT: 2})).to.equal('2 companies published new books.');

            expect(msgFmt.format({COMPANY_COUNT: 5})).to.equal('5 companies published new books.');

            expect(msgFmt.format({COMPANY_COUNT: 10})).to.equal('10 companies published new books.');
        });

        it('should format a message with ru-RU locale', function () {
            var msgFmt = new IntlMessageFormat(messages.ru, 'ru-RU');

            expect(msgFmt.format({COMPANY_COUNT: 0})).to.equal('0 компаний опубликовали новые книги.');

            expect(msgFmt.format({COMPANY_COUNT: 1})).to.equal('Одна компания опубликовала новые книги.');

            expect(msgFmt.format({COMPANY_COUNT: 2})).to.equal('2 компаний опубликовали новые книги.');

            expect(msgFmt.format({COMPANY_COUNT: 5})).to.equal('5 компаний опубликовали новые книги.');

            expect(msgFmt.format({COMPANY_COUNT: 10})).to.equal('10 компаний опубликовали новые книги.');
        });
    });

    describe('with empty language tags', function () {
        it('should fail and throw an error', function () {
            try {
                var msgFmt = new IntlMessageFormat('{NAME}', " ");
            } catch (e) {
                var err = new RangeError('Invalid language tag.');
                expect(e.toString()).to.equal(err.toString());
            }
        });
    });

    describe('arguments with', function () {

        describe('no spaces', function() {
            var msg = new IntlMessageFormat("{STATE}"),
                typeErr = new TypeError("Cannot read property 'STATE' of undefined"),
                refErr = new ReferenceError("The valueName `STATE` was not found."),
                state = 'Missouri',
                m;

            it('should fail when the format object is not provided', function () {
                try {
                    m = msg.format();
                } catch (e) {
                    expect(e.toString()).to.equal(typeErr.toString());
                }
            });

            it('should fail when the argument in the pattern is not provided', function () {
                try {
                    m = msg.format({ FOO: state });
                } catch (e) {
                    expect(e.toString()).to.equal(refErr.toString());
                }
            });

            it("should fail when the argument in the pattern has a typo", function () {
                try {
                    m = msg.format({ "ST ATE": state });
                } catch (e) {
                    expect(e.toString()).to.equal(refErr.toString());
                }
            });

            it("should succeed when the argument is correct", function () {
                m = msg.format({ STATE: state });
                expect(m).to.equal(state);
            });
        });

        describe('a space', function() {
            var msg,
                rangeErr = new RangeError('No tokens were provided.'),
                state = 'Missouri',
                m;

            it('should fail as no tokens are discovered in the string', function () {
                try {
                    msg = new IntlMessageFormat("{ST ATE}");
                    m = msg.format();
                } catch (e) {
                    expect(e.toString()).to.equal(rangeErr.toString());
                }
            });
        });

        describe('a numeral', function() {
            var msg = new IntlMessageFormat("{ST1ATE}"),
                typeErr = new TypeError("Cannot read property 'ST1ATE' of undefined"),
                refErr = new ReferenceError("The valueName `ST1ATE` was not found."),
                state = 'Missouri',
                m;

            it('should fail when the format object is not provided', function () {
                try {
                    m = msg.format();
                } catch (e) {
                    expect(e.toString()).to.equal(typeErr.toString());
                }
            });

            it('should fail when the argument in the pattern is not provided', function () {
                try {
                    m = msg.format({ FOO: state });
                } catch (e) {
                    expect(e.toString()).to.equal(refErr.toString());
                }
            });

            it("should fail when the argument in the pattern has a typo", function () {
                try {
                    m = msg.format({ "ST ATE": state });
                } catch (e) {
                    expect(e.toString()).to.equal(refErr.toString());
                }
            });

            it("should succeed when the argument is correct", function () {
                m = msg.format({ ST1ATE: state });
                expect(m).to.equal(state);
            });
        });
    });

});


