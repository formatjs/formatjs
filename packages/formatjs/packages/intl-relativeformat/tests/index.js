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

    describe('and relative time under the Spanish locale', function () {
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

    describe('and relative time under the English locale', function () {
        var rt = new IntlRelativeFormat('en');

        it('should return right now', function () {
            var m = rt.format(past());

            expect(m).to.equal('in 0 seconds');
        });

        it('should return 1 second past', function () {
            var m = rt.format(past(1000));

            expect(m).to.equal('1 second ago');
        });

        it('should returun 10 second past', function () {
            var m = rt.format(past(10 * 1000));

            expect(m).to.equal('10 seconds ago');
        });

        it('should return 2 minutes past', function () {
            var m = rt.format(past(2 * 60 * 1000));

            expect(m).to.equal('2 minutes ago');
        });

        it('should return 1 hour past', function () {
            var m = rt.format(past(60 * 60 * 1000));

            expect(m).to.equal('1 hour ago');
        });

        it('should return 2 hours past', function () {
            var m = rt.format(past(2 * 60 * 60 * 1000));

            expect(m).to.equal('2 hours ago');
        });

        it('should return 1 day past', function () {
            var m = rt.format(past(24 * 60 * 60 * 1000));

            expect(m).to.equal('1 day ago');
        });

        it('should return 2 days past', function () {
            var m = rt.format(past(2 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('2 days ago');
        });

        it('should return 1 month past', function () {
            var m = rt.format(past(30 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('1 month ago');
        });

        it('should return 2 months past', function () {
            var m = rt.format(past(2 * 30 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('2 months ago');
        });

        it('should return 1 year past', function () {
            var m = rt.format(past(356 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('1 year ago');
        });

        it('should return 2 years past', function () {
            var m = rt.format(past(2 * 365 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('2 years ago');
        });

        it('should return 2 years future', function () {
            var m = rt.format(future(2 * 365 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('in 2 years');
        });

        it('should return 1 year future', function () {
            var m = rt.format(future(356 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('in 1 year');
        });

        it('should return 2 months future', function () {
            var m = rt.format(future(2 * 30 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('in 2 months');
        });

        it('should return 1 month future', function () {
            var m = rt.format(future(30 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('in 1 month');
        });

        it('should return 2 days future', function () {
            var m = rt.format(future(2 * 24 * 60 * 60 * 1000));

            expect(m).to.equal('in 2 days');
        });

        it('should return 1 day future', function () {
            var m = rt.format(future(24 * 60 * 60 * 1000));

            expect(m).to.equal('in 1 day');
        });

        it('should return 2 minutes future', function () {
            var m = rt.format(future(2 * 60 * 1000));

            expect(m).to.equal('in 2 minutes');
        });

        it('should return 10 seconds future', function () {
            var m = rt.format(future(10 * 1000));

            expect(m).to.equal('in 10 seconds');
        });

        it('should return 1 second future', function () {
            var m = rt.format(future(1 * 1000));

            expect(m).to.equal('in 1 second');
        });
    });

});
