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

    // INSTANCE METHODS

    describe('#resolvedOptions( )', function () {
        it('should be a function', function () {
            var mf = new IntlMessageFormat('');
            expect(mf.resolvedOptions).to.be.a('function');
        });

        it('should have a `locale` property', function () {
            var mf = new IntlMessageFormat('');
            expect(mf.resolvedOptions()).to.have.key('locale');
        });

        describe('`locale`', function () {
            var IMFLocaleData = IntlMessageFormat.__localeData__;
            var localeData    = {};

            // Helper to remove and replace the locale data available during the
            // the different tests.
            function transferLocaleData(from, to) {
                for (var locale in from) {
                    if (Object.prototype.hasOwnProperty.call(from, locale)) {
                        if (locale === IntlMessageFormat.defaultLocale) {
                            continue;
                        }

                        to[locale] = from[locale];
                        delete from[locale];
                    }
                }
            }

            beforeEach(function () {
                transferLocaleData(IMFLocaleData, localeData);
            });

            afterEach(function () {
                transferLocaleData(localeData, IMFLocaleData);
            });

            it('should default to "en"', function () {
                var mf = new IntlMessageFormat('');
                expect(mf.resolvedOptions().locale).to.equal('en');
            });

            it('should normalize the casing', function () {
                transferLocaleData(localeData, IMFLocaleData);

                var mf = new IntlMessageFormat('', 'en-us');
                expect(mf.resolvedOptions().locale).to.equal('en-US');

                mf = new IntlMessageFormat('', 'EN-US');
                expect(mf.resolvedOptions().locale).to.equal('en-US');
            });

            it('should be a fallback value when data is missing', function () {
                IMFLocaleData.fr = localeData.fr;

                var mf = new IntlMessageFormat('', 'fr-FR');
                expect(mf.resolvedOptions().locale).to.equal('fr');

                mf = new IntlMessageFormat('', 'pt');
                expect(mf.resolvedOptions().locale).to.equal('en');
            });
        });
    });

    describe('#format( [object] )', function () {
        it('should be a function', function () {
            var mf = new IntlMessageFormat('');
            expect(mf.format).to.be.a('function');
        });

        it('should return a string', function () {
            var mf = new IntlMessageFormat('');
            expect(mf.format()).to.be.a('string');
        });
    });

    describe('using a string pattern', function () {
        it('should properly replace direct arguments in the string', function () {
            var mf = new IntlMessageFormat('My name is {FIRST} {LAST}.');
            var output = mf.format({
                FIRST: 'Anthony',
                LAST : 'Pipkin'
            });

            expect(output).to.equal('My name is Anthony Pipkin.');
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
                    'few {# компании опубликовали}' +
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
            expect(msgFmt.format({COMPANY_COUNT: 2})).to.equal('2 компании опубликовали новые книги.');
            expect(msgFmt.format({COMPANY_COUNT: 5})).to.equal('5 компаний опубликовали новые книги.');
            expect(msgFmt.format({COMPANY_COUNT: 10})).to.equal('10 компаний опубликовали новые книги.');
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

    describe('selectordinal arguments', function () {
        var msg = 'This is my {year, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} birthday.';

        it('should parse without errors', function () {
            expect(IntlMessageFormat.__parse).withArgs(msg).to.not.throwException();
        });

        it('should use ordinal pluralization rules', function () {
            var mf = new IntlMessageFormat(msg, 'en');

            expect(mf.format({year: 1})).to.equal('This is my 1st birthday.');
            expect(mf.format({year: 2})).to.equal('This is my 2nd birthday.');
            expect(mf.format({year: 3})).to.equal('This is my 3rd birthday.');
            expect(mf.format({year: 4})).to.equal('This is my 4th birthday.');
            expect(mf.format({year: 11})).to.equal('This is my 11th birthday.');
            expect(mf.format({year: 21})).to.equal('This is my 21st birthday.');
            expect(mf.format({year: 22})).to.equal('This is my 22nd birthday.');
            expect(mf.format({year: 33})).to.equal('This is my 33rd birthday.');
            expect(mf.format({year: 44})).to.equal('This is my 44th birthday.');
            expect(mf.format({year: 1024})).to.equal('This is my 1,024th birthday.');
        });
    });

    describe('exceptions', function () {
        it('should use the correct PT plural rules', function () {
            var msg  = '{num, plural, one{one} other{other}}';
            var pt   = new IntlMessageFormat(msg, 'pt');
            var ptMZ = new IntlMessageFormat(msg, 'pt-MZ');

            expect(pt.format({num: 0})).to.equal('one');
            expect(ptMZ.format({num: 0})).to.equal('other');
        });
    });
});
