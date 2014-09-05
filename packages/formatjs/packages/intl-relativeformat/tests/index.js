/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it,beforeEach,afterEach */
'use strict';

var chai,
    expect,
    IntlRelativeFormat;

var TS = 1409810798651;

function past(v) {
    return new Date().getTime() - (v || 0);
}

function future(v) {
    return new Date().getTime() + (v || 0);
}

// This oddity is so that this file can be used for both client-side and
// server-side testing.  (On the client we've already loaded chai and
// IntlRelativeFormat.)
if ('function' === typeof require) {

    chai = require('chai');

    if (typeof global.Intl === 'undefined'){
        global.Intl = require('intl');
    }

    IntlRelativeFormat = require('../');

}

expect = chai.expect;

describe('IntlRelativeFormat', function () {

    it('should be a function', function () {
        expect(IntlRelativeFormat).to.be.a('function');
    });

    // STATIC

    describe('.__addLocaleData( [obj] )', function () {
        it('should respond to .__addLocaleData()', function () {
            expect(IntlRelativeFormat).itself.to.respondTo('__addLocaleData');
        });
    });

    // CONSTRUCTOR PROPERTIES

    describe('#_locale', function () {
        var defaultLocale = IntlRelativeFormat.defaultLocale;

        afterEach(function () {
            IntlRelativeFormat.defaultLocale = defaultLocale;
        });

        it('should be a default value', function () {
            // Set defaultLocale to "en".
            IntlRelativeFormat.defaultLocale = 'en';

            var msgFmt = new IntlRelativeFormat();
            expect(msgFmt._locale).to.equal('en');
        });

        it('should be equal to the second parameter\'s language code', function () {
            var msgFmt = new IntlRelativeFormat('en-US');
            expect(msgFmt._locale).to.equal('en');
        });

    });

    // INSTANCE METHODS

    describe('#resolvedOptions( )', function () {
        var msgFmt;

        beforeEach(function () {
            msgFmt = new IntlRelativeFormat();
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

            expect(pCount).to.equal(1);
        });
    });

    describe('#format( [object] )', function () {
        it('should be a function', function () {
            var msgFmt = new IntlRelativeFormat();
            expect(msgFmt.format).to.be.a('function');
            expect(msgFmt).to.respondTo('format');
        });
    });

    describe('and relative time under the ES locale', function () {
        var rt = new IntlRelativeFormat('es');

        it('should return right now', function () {
            var m = rt.format(past());

            expect(m).to.equal('dentro de 0 segundos');
        });

        it('should return 1 second past', function () {
            var m = rt.format(past(1000));

            expect(m).to.equal('hace 1 segundo');
        });

        it('should returun 10 second past', function () {
            var m = rt.format(past(10 * 1000));

            expect(m).to.equal('hace 10 segundos');
        });

        it('should return 2 minutes past', function () {
            var m = rt.format(past(2 * 60 * 1000));

            expect(m).to.equal('hace 2 minutos');
        });

        it('should return 2 minutes future', function () {
            var m = rt.format(future(2 * 60 * 1000));

            expect(m).to.equal('dentro de 2 minutos');
        });

        it('should return 10 seconds future', function () {
            var m = rt.format(future(10 * 1000));

            expect(m).to.equal('dentro de 10 segundos');
        });

        it('should return 1 seconds future', function () {
            var m = rt.format(future(1 * 1000));

            expect(m).to.equal('dentro de 1 segundo');
        });
    });

});
