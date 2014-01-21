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
    intl,
    IntlMessageFormat;


// This oddity is so that this file can be used for both client-side and
// server-side testing.  (On the client we've already loaded chai and
// IntlMessageFormat.)
if ('function' === typeof require) {

    chai = require('chai');

    IntlMessageFormat = require('../index.js');

    if (typeof Intl === 'undefined'){
        global.Intl = require('intl');
    }

    require('../locale-data/en.js');
    require('../locale-data/ar.js');
    require('../locale-data/pl.js');

}
expect = chai.expect;

global.Intl = global.Intl || intl;

describe('IntlMessageFormat', function () {

    it('should be a function', function () {
        expect(IntlMessageFormat).to.be.a('function');
    });

    // STATIC
    describe('.__addLocaleData( [obj] )', function () {
        it('should respond to .__addLocaleData()', function () {
            expect(IntlMessageFormat).itself.to.respondTo('__addLocaleData');
        });
    });

    describe('.parse( [messagePattern] )', function () {
        it('should respond to .parse()', function () {
            expect(IntlMessageFormat).itself.to.respondTo('parse');
        });

        it('should fail with an imbalanced bracket', function () {
            try {
                IntlMessageFormat.parse('{imbalanced} tokens}');
            } catch (e) {
                var err = new Error('Imbalanced bracket detected at index 19 for message "{imbalanced} tokens}"');
                expect(err.toString()).to.equal(e.toString());
            }
        });

        it('should fail if the brackets are not closed properly', function () {
            try {
                IntlMessageFormat.parse('{{hello}');
            } catch (e) {
                var err = new Error('Brackets were not properly closed: {{hello}');
                expect(err.toString()).to.equal(e.toString());
            }
        });

        it('should fail if options tokens are not supplied in pairs', function () {
            try {
                IntlMessageFormat.parse('{FOO, plural, one {bar} other}');
            } catch (e) {
                var err = new Error('Options must come in pairs: one, {bar}, other');
                expect(err.toString()).to.equal(e.toString());
            }
        });

        it('should fail if a default `other` option is not supplied', function () {
            try {
                IntlMessageFormat.parse('{Foo, plural, one {bar} few {baz}}');
            } catch (e) {
                var err = new Error('Options must include default \"other\" option: one, {bar}, few, {baz}');
                expect(err.toString()).to.equal(e.toString());
            }
        });

        it('should parse the pattern into an array', function () {
            var i, len, pattern,
                patterns = [
                    {
                        name: 'basic string',
                        pattern: '{KAMEN} {RIDER} is {STRONGER} than you!',
                        parsed: [
                            '${KAMEN}',
                            ' ',
                            '${RIDER}',
                            ' is ',
                            '${STRONGER}',
                            ' than you!',
                        ]
                    }, {
                        name: 'basic plural',
                        pattern: 'There {NUM_RIDERS, plural, one {is only one} other {are #}} kamen rider(s)',
                        parsed: [
                            'There ',
                            {
                                type: 'plural',
                                valueName: 'NUM_RIDERS',
                                options: {
                                    one: 'is only one',
                                    other: 'are ${#}'
                                }
                            },
                            ' kamen rider(s)'
                        ]
                    }, {
                        name: 'basic select',
                        pattern: 'Kamen rider is {LEVEL, select, good {awesome} better {very awesome} best {awesome-possum} other {amaaazing}}!!',
                        parsed: [
                            'Kamen rider is ',
                            {
                                type: 'select',
                                valueName: 'LEVEL',
                                options: {
                                    good: 'awesome',
                                    better: 'very awesome',
                                    best: 'awesome-possum',
                                    other: 'amaaazing'
                                }
                            },
                            '!!'
                        ]
                    }, {
                        name: 'basic time',
                        pattern: 'Today is {TIME, time, long}.',
                        parsed: [
                            'Today is ',
                            {
                                type: 'time',
                                valueName: 'TIME',
                                format: 'long'
                            },
                            '.'
                        ]
                    }, {
                        name: 'basic time - defaulting',
                        pattern: 'Today is {TIME, time}.',
                        parsed: [
                            'Today is ',
                            {
                                type: 'time',
                                valueName: 'TIME',
                                format: 'medium'
                            },
                            '.'
                        ]
                    }, {
                        name: 'basic date',
                        pattern: 'Today is {TIME, date, short}.',
                        parsed: [
                            'Today is ',
                            {
                                type: 'date',
                                valueName: 'TIME',
                                format: 'short'
                            },
                            '.'
                        ]
                    }, {
                        name: 'basic date - defaulting',
                        pattern: 'Today is {TIME, date}.',
                        parsed: [
                            'Today is ',
                            {
                                type: 'date',
                                valueName: 'TIME',
                                format: 'medium'
                            },
                            '.'
                        ]
                    }, {
                        name: 'basic number',
                        pattern: 'There are {POPULATION, number, integer} people in {CITY}.',
                        parsed: [
                            'There are ',
                            {
                                type: 'number',
                                valueName: 'POPULATION',
                                format: 'integer'
                            },
                            ' people in ',
                            '${CITY}',
                            '.'
                        ]
                    }, {
                        name: 'complex pattern with string, plural, and select',
                        pattern: '{TRAVELLERS} {TRAVELLER_COUNT, plural, one {est {GENDER, select, female {allée} other {allé}}} other {sont {GENDER, select, female {allées} other {allés}}}} à {CITY}.',
                        parsed: [
                            '${TRAVELLERS}',
                            ' ',
                            {
                                type: 'plural',
                                valueName: 'TRAVELLER_COUNT',
                                options: {
                                    one: [
                                        'est ',
                                        {
                                            type: 'select',
                                            valueName: 'GENDER',
                                            options: {
                                                female: 'allée',
                                                other: 'allé'
                                            }
                                        }
                                    ],
                                    other: [
                                        'sont ',
                                        {
                                            type: 'select',
                                            valueName: 'GENDER',
                                            options: {
                                                female: 'allées',
                                                other: 'allés'
                                            }
                                        }
                                    ]
                                }
                            },
                            ' à ',
                            '${CITY}',
                            '.'
                        ]
                    }
                ];



            for (i = 0, len = patterns.length; i < len; i++) {
                pattern = patterns[i];
                console.log(pattern.name);
                expect(IntlMessageFormat.parse(pattern.pattern), pattern.name).to.deep.equal(pattern.parsed);
            }


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
            var msgFmt = new IntlMessageFormat('My name is {NAME}');

            expect(msgFmt.pattern).to.be.an('array');
            expect(msgFmt.pattern.length).to.equal(2);
            expect(msgFmt.pattern[0]).to.equal('My name is ');
            expect(msgFmt.pattern[1]).to.be.a('string');
            expect(msgFmt.pattern[1]).to.equal('${NAME}');
        });

    });

    describe('#formatters', function () {
        it('should be an empty object without a third parameter', function () {
            var msgFmt = new IntlMessageFormat();

            expect(msgFmt.formatters).to.be.an('object');


            // Randomly test for default formatters to exist
            expect(msgFmt.formatters.number_integer).to.be.a('function');
            expect(msgFmt.formatters.date_short).to.be.a('function');
            expect(msgFmt.formatters.time_long).to.be.a('function');
        });

        it('should maintain the default formatters', function () {
            var msgFmtA = new IntlMessageFormat(null, null, {
                    foo: function (val) {
                        return 'foo: ' + val;
                    }
                }),
                msgFmtB;


            expect(msgFmtA.formatters.foo).to.be.a('function');
            expect(msgFmtA.formatters.time_long).to.be.a('function');
            expect(msgFmtA.formatters.foo('bar')).to.equal('foo: bar');




            msgFmtB = new IntlMessageFormat();

            /*jshint expr:true*/
            expect(msgFmtB.formatters.foo).to.not.exist;
            /*jshint expr:true*/
            expect(msgFmtB.formatters.time_long).to.exist;
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

        it('should throw an error when no parameter is passed', function () {
            msgFmt = new IntlMessageFormat();
            try {
                msgFmt.format();
            } catch (e) {
                var err = new ReferenceError('`format` expects the first argument to be an Object. undefined was found.');
                expect(err.toString()).to.equal(e.toString());
            }
        });

    });

    describe('using a string pattern', function () {

        it('should fail if there is no argument in the string', function () {
            var msgFmt = new IntlMessageFormat('My name is {FIRST LAST}'),
                m = msgFmt.format({
                        FIRST: 'Anthony',
                        LAST: 'Pipkin'
                    });

            expect(m).to.equal('My name is {FIRST LAST}');
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
            var msgFmt = new IntlMessageFormat('My name is {FIRST} {LAST}.'),
                m = msgFmt.format({
                    FIRST: 'Anthony',
                    LAST : 'Pipkin'
                });

            expect(m).to.be.a('string');
            expect(m).to.equal('My name is Anthony Pipkin.');
        });

        it('should process an argument with a value formatter', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat('Test formatter d: {num, d}', null, {
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

            msgFmt = new IntlMessageFormat('Test formatter foo: {NUM, foo}', null, {
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


            msg = new IntlMessageFormat('d: {num, d} / f: {num, f}', 'en-US', new CustomFormatters());

            m = msg.format({
                num: 0
            });

            expect(m).to.equal('d: 0 / f: 0080');
        });

        it('should work when the pattern is replaced', function () {
           var msg, m;

            msg = new IntlMessageFormat('{NAME} {FORMULA}', 'en-US');

            msg.pattern = '{FORMULA} {NAME}';

            m = msg.format({
                NAME: 'apipkin'
            });

            expect(m).to.equal('{FORMULA} apipkin');

        });

    });

    describe('using an Array pattern', function () {
        it('should concatenate the Array', function () {
            var msgFmt, m;

            msgFmt = new IntlMessageFormat(['I have ', 2, ' cars.']);

            // pass an object to prevent throwing
            m = msgFmt.format({});

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

            msgFmt = new IntlMessageFormat(['{', 'company', '}', ' {', 'verb' ,'}.']);

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
                    format: function (val, locale) {
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
                en: '{TRAVELLERS} went to {CITY}.',

                fr: [
                    '{TRAVELLERS}',
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
                    '{CITY}',
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
                emptyErr = new ReferenceError('`format` expects the first argument to be an Object. undefined was found.'),
                typeErr = new TypeError("Cannot read property 'STATE' of undefined"),
                refErr = new ReferenceError("The valueName `STATE` was not found."),
                state = 'Missouri',
                m;

            it('should fail when the format object is not provided', function () {
                try {
                    m = msg.format();
                } catch (e) {
                    expect(e.toString()).to.equal(emptyErr.toString());
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

            it('should return the same string as no tokens are discovered', function () {
                msg = new IntlMessageFormat("{ST ATE}");
                m = msg.format({
                    "ST ATE": state
                });

                expect(m).to.equal('{ST ATE}');
            });
        });

        describe('a numeral', function() {
            var msg = new IntlMessageFormat("{ST1ATE}"),
                emptyErr = new ReferenceError('`format` expects the first argument to be an Object. undefined was found.'),
                typeErr = new TypeError("Cannot read property 'ST1ATE' of undefined"),
                refErr = new ReferenceError("The valueName `ST1ATE` was not found."),
                state = 'Missouri',
                m;

            it('should fail when the format object is not provided', function () {
                try {
                    m = msg.format();
                } catch (e) {
                    expect(e.toString()).to.equal(emptyErr.toString());
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

    describe('formatting patterns with formatters', function () {
        // have to use "parsed" values until parser is in there
        it('should format numbers into integers', function () {
            // {NUMBER, number, integer}
            var msgFmt = new IntlMessageFormat([{
                    type: 'number',
                    valueName: 'NUMBER',
                    formatter: 'integer'
                }], 'en-US'),
                m = msgFmt.format({ NUMBER: 30000 });

            expect(m).to.equal('30,000');
        });

        it('should format numbers into currency', function () {
            // {NUMBER, number, currency}
            var msgFmt = new IntlMessageFormat([{
                    type: 'number',
                    valueName: 'NUMBER',
                    formatter: 'currency'
                }], 'en-US'),
                m = msgFmt.format({
                    NUMBER: 30000,
                    currency: 'USD'
                });

            expect(m, 'as `currency`').to.equal('$30,000.00');

            m = msgFmt.format({
                NUMBER: 30000,
                CURRENCY: 'USD'
            });

            expect(m, 'as `CURRENCY`').to.equal('$30,000.00');

            m = msgFmt.format({
                NUMBER: 30000
            });

            expect(m, 'as `undefined`').to.equal('$30,000.00');
        });

        it('should format numbers into a percent', function () {
            // {NUMBER, number, percent}
            var msgFmt = new IntlMessageFormat([{
                    type: 'number',
                    valueName: 'NUMBER',
                    formatter: 'percent'
                }], 'en-US'),
                m = msgFmt.format({ NUMBER: 30 });

            expect(m).to.equal('3,000%');
        });

        // Fri Jan 17 2014 17:44:57 GMT-0500 (EST)
        // timestamp 1389998697742
        it('should format date into short', function () {
            // {DATE, date, short}
            var msgFmt = new IntlMessageFormat([{
                    type: 'date',
                    valueName: 'DATE',
                    formatter: 'short'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('1/17/2014');
        });

        it('should format date into medium', function () {
            // {DATE, date, medium}
            var msgFmt = new IntlMessageFormat([{
                    type: 'date',
                    valueName: 'DATE',
                    formatter: 'medium'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('Jan 17, 2014');
        });

        it('should format date into long', function () {
            // {DATE, date, long}
            var msgFmt = new IntlMessageFormat([{
                    type: 'date',
                    valueName: 'DATE',
                    formatter: 'long'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('Jan 17, 2014');
        });

        it('should format date into a full', function () {
            // {DATE, date, full}
            var msgFmt = new IntlMessageFormat([{
                    type: 'date',
                    valueName: 'DATE',
                    formatter: 'full'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('Fri, Jan 17, 2014');
        });

        it('should format time into short', function () {
            // {DATE, time, short}
            var msgFmt = new IntlMessageFormat([{
                    type: 'time',
                    valueName: 'DATE',
                    formatter: 'short'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('5:44 PM');
        });

        it('should format time into medium', function () {
            // {DATE, time, medium}
            var msgFmt = new IntlMessageFormat([{
                    type: 'time',
                    valueName: 'DATE',
                    formatter: 'medium'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('5:44:57 PM');
        });

        it('should format time into long', function () {
            // {DATE, time, long}
            var msgFmt = new IntlMessageFormat([{
                    type: 'time',
                    valueName: 'DATE',
                    formatter: 'long'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('5:44:57 PM');
        });

        it('should format time into a full', function () {
            // {DATE, time, full}
            var msgFmt = new IntlMessageFormat([{
                    type: 'time',
                    valueName: 'DATE',
                    formatter: 'full'
                }], 'en-US'),
                m = msgFmt.format({
                    DATE: new Date(1389998697742),
                    timeZone: 'UTC'
                });

            expect(m).to.equal('5:44:57 PM');
        });

    });

});


