/* global beforeEach, afterEach, describe, it */
'use strict';

var Intl         = global.Intl;
var IntlPolyfill = require('intl');

var expect                  = require('expect.js');
var areIntlLocalesSupported = require('../../');

describe('exports', function () {
    it('should have a default export function', function () {
        expect(areIntlLocalesSupported).to.be.a('function');
    });
});

describe('areIntlLocalesSupported()', function () {
    var globalIntl = null;

    function clearGlobalIntl() {
        if (Intl) {
            Object.getOwnPropertyNames(global.Intl).forEach(function (prop) {
                delete global.Intl[prop];
            });
        } else {
            global.Intl = {};
        }
    }

    function copyProps(source, target) {
        return Object.getOwnPropertyNames(source).reduce(function (target, prop) {
            target[prop] = source[prop];
            return target;
        }, target);
    }

    beforeEach(function () {
        globalIntl = copyProps(global.Intl, {});
    });

    afterEach(function () {
        clearGlobalIntl();
        copyProps(globalIntl, global.Intl);
    });

    describe('missing Intl', function () {
        beforeEach(function () {
            clearGlobalIntl();
        });

        it('should return `false` for "en"', function () {
            expect(areIntlLocalesSupported('en')).to.be.false;
        });
    });

    describe('polyfill', function () {
        beforeEach(function () {
            clearGlobalIntl();
            copyProps(IntlPolyfill, global.Intl);
        });

        it('should return `true` for "en"', function () {
            expect(areIntlLocalesSupported('en')).to.be.true;
        });

        it('should return `true` for "fr"', function () {
            expect(areIntlLocalesSupported('fr')).to.be.true;
        });
    });

    if (Intl) {
        describe('built-in', function () {
            it('should return `true` for "en"', function () {
                expect(areIntlLocalesSupported('en')).to.be.true;
            });

            it('should return `false` for "fr"', function () {
                expect(areIntlLocalesSupported('fr')).to.be.false;
            });
        });
    }
});
