/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it,beforeEach,afterEach,expect,IntlMessageFormat */
'use strict';

describe('IntlMessageFormat', function () {

    it('should be a function', function () {
        expect(IntlMessageFormat).to.be.a('function');
    });

    // STATIC

    describe('.__addLocaleData( [obj] )', function () {
        it('should respond to .__addLocaleData()', function () {
            expect(IntlMessageFormat.__addLocaleData).to.be.a('function');
        });
    });

    // CONSTRUCTOR PROPERTIES

    describe('#_locale', function () {
        var defaultLocale = IntlMessageFormat.defaultLocale;

        afterEach(function () {
            IntlMessageFormat.defaultLocale = defaultLocale;
        });

        it('should be a default value', function () {
            // Set defaultLocale to "en".
            IntlMessageFormat.defaultLocale = 'en';

            var msgFmt = new IntlMessageFormat('');
            expect(msgFmt._locale).to.equal('en');
        });

        it('should be equal to the second parameter\'s language code', function () {
            var msgFmt = new IntlMessageFormat('', 'en-US');
            expect(msgFmt._locale).to.equal('en');
        });

    });

    describe('#_pluralLocale', function () {
        var msgFmt = new IntlMessageFormat('');

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralLocale).to.be(undefined);
        });
    });

    describe('#_pluralFunc', function () {
        var msgFmt = new IntlMessageFormat('');

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralFunc).to.be(undefined);
        });
    });

    describe('#pattern', function () {
        it('should be undefined', function () {
            var msgFmt = new IntlMessageFormat('');
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.be.ok();
        });

        it('should be undefined when first parameter is ommited', function () {
            var msgFmt = new IntlMessageFormat('');
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.be.ok();
        });
    });

    // INSTANCE METHODS

    describe('#resolvedOptions( )', function () {
        var msgFmt;

        beforeEach(function () {
            msgFmt = new IntlMessageFormat('');
        });

        it('should be a function', function () {
            expect(msgFmt.resolvedOptions).to.be.a('function');
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

            expect(pCount).to.equal(1);
        });
    });

    describe('#format( [object] )', function () {
        it('should be a function', function () {
            var msgFmt = new IntlMessageFormat('');
            expect(msgFmt.format).to.be.a('function');
        });
    });

    describe('using a string pattern', function () {

        // TODO: Determine if spaces are valid in argument names in Yala; and if
        // not, then remove this test.
        // it('should fail if there is no argument in the string', function () {
        //     var msgFmt = new IntlMessageFormat('My name is {FIRST LAST}'),
        //         m = msgFmt.format({
        //                 FIRST: 'Anthony',
        //                 LAST: 'Pipkin'
        //             });
        //
        //     expect(m).to.equal('My name is {FIRST LAST}');
        // });

        it('should properly replace direct arguments in the string', function () {
            var msgFmt = new IntlMessageFormat('My name is {FIRST} {LAST}.'),
                m = msgFmt.format({
                    FIRST: 'Anthony',
                    LAST : 'Pipkin'
                });

            expect(m).to.be.a('string');
            expect(m).to.equal('My name is Anthony Pipkin.');
        });

    });

    describe('and plurals under the Arabic locale', function () {
        var msg = '' +
            'I have {numPeople, plural,' +
                'zero {zero points}' +
                'one {a point}' +
                'two {two points}' +
                'few {a few points}' +
                'many {lots of points}' +
                'other {some other amount of points}}' +
            '.';

        var msgFmt = new IntlMessageFormat(msg, 'ar');

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
            en: '{NAME} went to {CITY}.',

            fr: '{NAME} est {GENDER, select, ' +
                    'female {allée}' +
                    'other {allé}}'+
                ' à {CITY}.'
        };

        var complex = {
            en: '{TRAVELLERS} went to {CITY}.',

            fr: '{TRAVELLERS} {TRAVELLER_COUNT, plural, ' +
                    '=1 {est {GENDER, select, ' +
                        'female {allée}' +
                        'other {allé}}}' +
                    'other {sont {GENDER, select, ' +
                        'female {allées}' +
                        'other {allés}}}}' +
                ' à {CITY}.'
        };

        var maleObj = {
            NAME  : 'Tony',
            CITY  : 'Paris',
            GENDER: 'male'
        };

        var femaleObj = {
            NAME  : 'Jenny',
            CITY  : 'Paris',
            GENDER: 'female'
        };

        var maleTravelers = {
            TRAVELLERS     : 'Lucas, Tony and Drew',
            TRAVELLER_COUNT: 3,
            GENDER         : 'male',
            CITY           : 'Paris'
        };

        var femaleTravelers = {
            TRAVELLERS     : 'Monica',
            TRAVELLER_COUNT: 1,
            GENDER         : 'female',
            CITY           : 'Paris'
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
            en: '{COMPANY_COUNT, plural, ' +
                    '=1 {One company}' +
                    'other {# companies}}' +
                ' published new books.',

            ru: '{COMPANY_COUNT, plural, ' +
                    'one {Одна компания опубликовала}' +
                    'many {# компаний опубликовали}' +
                    'other {# компаний опубликовали}}' +
                ' новые книги.'
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
            function createWithInvalidLocale() {
                return new IntlMessageFormat('{NAME}', ' ');
            }

            expect(createWithInvalidLocale).to.throwException(function (e) {
                expect(e).to.be.an(Error);
            });
        });
    });

    describe('arguments with', function () {

        describe('no spaces', function() {
            var msg   = new IntlMessageFormat('{STATE}'),
                state = 'Missouri';

            it('should fail when the argument in the pattern is not provided', function () {
                expect(msg.format).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
            });

            it('should fail when the argument in the pattern has a typo', function () {
                function formatWithValueNameTypo() {
                    return msg.format({'ST ATE': state});
                }

                expect(formatWithValueNameTypo).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
            });

            it('should succeed when the argument is correct', function () {
                expect(msg.format({ STATE: state })).to.equal(state);
            });
        });

        // TODO: Determine if spaces are valid in argument names in Yala; and if
        // not, then remove this test.
        // describe('a space', function() {
        //     it('should return the same string as no tokens are discovered', function () {
        //         expect(new IntlMessageFormat('{ST ATE}').format({'ST ATE': 'Missouri'})).to.equal('{ST ATE}');
        //     });
        // });

        describe('a numeral', function() {
            var msg   = new IntlMessageFormat('{ST1ATE}'),
                state = 'Missouri';

            it('should fail when the argument in the pattern is not provided', function () {
                function formatWithMissingValue() {
                    return msg.format({ FOO: state });
                }

                expect(formatWithMissingValue).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
            });

            it('should fail when the argument in the pattern has a typo', function () {
                function formatWithMissingValue() {
                    msg.format({ 'ST ATE': state });
                }

                expect(formatWithMissingValue).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
            });

            it('should succeed when the argument is correct', function () {
                expect(msg.format({ ST1ATE: state })).to.equal(state);
            });
        });
    });
});
