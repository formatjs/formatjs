/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

 /* global describe, it */
'use strict';

var expect      = require('expect.js');
var extractData = require('../../');

describe('exports', function () {
    it('should have a single default export function', function () {
        expect(extractData).to.be.a('function');
        expect(Object.keys(extractData)).to.eql([]);
    });
});

describe('Data shape', function () {
    var data = extractData({
        pluralRules   : true,
        relativeFields: true,
    });

    it('should be keyed by locale', function () {
        expect(data).to.have.keys('en', 'zh');
    });

    it('should have object values for each locale key', function () {
        expect(data.en).to.be.an('object');
        expect(data.zh).to.be.an('object');
    });

    describe('locale data object', function () {
        it('should have a `locale` property equal to the locale', function () {
            var locale     = Object.keys(data)[0];
            var localeData = data[locale];

            expect(localeData).to.have.key('locale');
            expect(localeData.locale).to.be.a('string');
            expect(localeData.locale).to.equal(locale);
        });

        it('should have a `pluralRuleFunction`', function () {
            expect(data.en).to.have.key('pluralRuleFunction');
            expect(data.en.pluralRuleFunction).to.be.a('function');
        });

        it('should have a `fields` object property', function () {
            expect(data.en).to.have.key('fields');
            expect(data.en.fields).to.be.an('object');
        });

        describe('`fields` objects', function () {
            var field = data.en.fields[Object.keys(data.en.fields)[0]];

            it('should have a `displayName` string property', function () {
                expect(field).to.have.key('displayName');
                expect(field.displayName).to.be.a('string');
            });

            it('should have a `relative` object property', function () {
                expect(field).to.have.key('relative');
                expect(field.relative).to.be.an('object');
            });

            it('should have a `relativeTime` object property', function () {
                expect(field).to.have.key('relativeTime');
                expect(field.relativeTime).to.be.an('object');
            });

            describe('`relative` object', function () {
                var keys = Object.keys(field.relative);

                it('should have numeric keys', function () {
                    keys.forEach(function (key) {
                        key = parseInt(key, 10);
                        expect(key).to.be.a('number');
                        expect(isNaN(key)).to.be(false);
                    });
                });

                it('should have string values', function () {
                    keys.forEach(function (key) {
                        expect(field.relative[key]).to.be.a('string');
                    });
                });
            });

            describe('`relativeTime` object', function () {
                it('should have `future` and `past` object properties', function () {
                    expect(field.relativeTime).to.have.keys('future', 'past');
                    expect(field.relativeTime.future).to.be.an('object');
                    expect(field.relativeTime.past).to.be.an('object');
                });

                describe('`future` object', function () {
                    var future = field.relativeTime.future;
                    var keys   = Object.keys(future);

                    it('should have an `other` key', function () {
                        expect(future).to.have.key('other');
                    });

                    it('should have string values', function () {
                        keys.forEach(function (key) {
                            expect(future[key]).to.be.a('string');
                        });
                    });
                });

                describe('`past` object', function () {
                    var past = field.relativeTime.past;
                    var keys = Object.keys(past);

                    it('should have an `other` key', function () {
                        expect(past).to.have.key('other');
                    });

                    it('should have string values', function () {
                        keys.forEach(function (key) {
                            expect(past[key]).to.be.a('string');
                        });
                    });
                });
            });
        });
    });
});

describe('extractData()', function () {
    it('should always return an object', function () {
        expect(extractData).withArgs().to.not.throwException();
        expect(extractData()).to.eql({});
    });

    describe('Options', function () {
        describe('locales', function () {
            it('should default to all available locales', function () {
                var data = extractData({pluralRules: true});
                expect(Object.keys(data).length).to.be.greaterThan(0);
            });

            it('should only accept an array of strings', function () {
                expect(extractData).withArgs({locales: []}).to.not.throwException();
                expect(extractData).withArgs({locales: ['en']}).to.not.throwException();

                expect(extractData).withArgs({locales: [true]}).to.throwException();
                expect(extractData).withArgs({locales: true}).to.throwException();
                expect(extractData).withArgs({locales: 'en'}).to.throwException();
            });

            it('should throw when no data exists for a locale', function () {
                expect(extractData).withArgs({locales: ['foo-bar']}).to.throwException();
            });

            it('should recursively expand `locales` to their roots', function () {
                var data = extractData({
                    locales       : ['en-US', 'zh-Hant-TW'],
                    pluralRules   : true,
                    relativeFields: true,
                });

                expect(data).to.have.keys('en', 'zh', 'zh-Hant');
            });

            it('should accept `locales` of any case and normalize them', function () {
                expect(extractData({
                    locales     : ['en-us', 'ZH-HANT-HK'],
                    pluralRules : true,
                })).to.have.keys('en', 'zh');

                expect(extractData({
                    locales       : ['en-us', 'ZH-HANT-HK'],
                    pluralRules   : true,
                    relativeFields: true,
                })).to.have.keys('en', 'zh', 'zh-Hant', 'zh-Hant-HK');
            });
        });

        describe('pluralRules', function () {
            it('should contribute a `pluralRuleFunction` function property', function () {
                var data = extractData({pluralRules: true});
                Object.keys(data).forEach(function (key) {
                    expect(data[key]).to.have.key('pluralRuleFunction');
                    expect(data[key].pluralRuleFunction).to.be.a('function');
                });
            });
        });

        describe('relativeFields', function () {
            it('should contribute a `fields` object property', function () {
                var data = extractData({relativeFields: true});
                Object.keys(data).forEach(function (key) {
                    expect(data[key]).to.have.key('fields');
                    expect(data[key].fields).to.be.an('object');
                });
            });
        });
    });
});
