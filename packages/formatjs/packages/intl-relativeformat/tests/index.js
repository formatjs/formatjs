/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it,beforeEach,afterEach,expect,Intl,IntlRelativeFormat */
'use strict';

var TS = 1409810798651;

function past(v) {
    return new Date().getTime() - (v || 0);
}

function future(v) {
    return new Date().getTime() + (v || 0);
}

function now() {
    return (new Date()).getTime();
}

describe('IntlRelativeFormat', function () {

    it('should be a function', function () {
        expect(IntlRelativeFormat).to.be.a('function');
    });

    // STATIC

    describe('.__addLocaleData( [obj] )', function () {
        it('should respond to .__addLocaleData()', function () {
            expect(IntlRelativeFormat.__addLocaleData).to.be.a('function');
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

            var rf = new IntlRelativeFormat();
            expect(rf._locale).to.equal('en');
        });

        it('should be equal to the second parameter\'s language code', function () {
            var rf = new IntlRelativeFormat('en-US');
            expect(rf._locale).to.equal('en');
        });

    });

    describe('options', function () {
        describe('style', function () {
            it('should defaul to "best fit"', function () {
                var resolvedOptions = new IntlRelativeFormat().resolvedOptions();

                expect(resolvedOptions).to.have.property('style');
                expect(resolvedOptions.style).to.equal('best fit');
            });

            it('should use relative units when "best fit"', function () {
                var rf = new IntlRelativeFormat('en');

                function expectNoNumberInOutput(output) {
                    expect(/\d+/.test(output)).to.equal(false);
                }

                expectNoNumberInOutput(rf.format(now()));
                expectNoNumberInOutput(rf.format(past(24 * 60 * 60 * 1000)));
                expectNoNumberInOutput(rf.format(past(30 * 24 * 60 * 60 * 1000)));
                expectNoNumberInOutput(rf.format(future(24 * 60 * 60 * 1000)));
                expectNoNumberInOutput(rf.format(future(30 * 24 * 60 * 60 * 1000)));
            });

            it('should always output a number when "numeric" is specified', function () {
                var rf = new IntlRelativeFormat('en', {style: 'numeric'});

                function expectNumberInOutput(output) {
                    expect(/\d+/.test(output)).to.equal(true);
                }

                expectNumberInOutput(rf.format(now()));
                expectNumberInOutput(rf.format(past(24 * 60 * 60 * 1000)));
                expectNumberInOutput(rf.format(past(30 * 24 * 60 * 60 * 1000)));
                expectNumberInOutput(rf.format(future(24 * 60 * 60 * 1000)));
                expectNumberInOutput(rf.format(future(30 * 24 * 60 * 60 * 1000)));
            });
        });

        describe('units', function () {
            it('should default to `undefined`', function () {
                var resolvedOptions = new IntlRelativeFormat().resolvedOptions();

                expect(resolvedOptions).to.have.property('units');
                expect(resolvedOptions.units).to.equal(undefined);
            });

            it('should always output in the specified units', function () {
                var rf = new IntlRelativeFormat('en', {units: 'day'});

                expect(rf.format(now())).to.equal('today');
                expect(rf.format(past(24 * 60 * 60 * 1000))).to.equal('yesterday');
                expect(rf.format(past(30 * 24 * 60 * 60 * 1000))).to.equal('30 days ago');
                expect(rf.format(future(24 * 60 * 60 * 1000))).to.equal('tomorrow');
                expect(rf.format(future(30 * 24 * 60 * 60 * 1000))).to.equal('in 30 days');
            });

            it('should validate the specified units', function () {
                function createInstance(options) {
                    return function () {
                        return new IntlRelativeFormat('en', options);
                    };
                }

                expect(createInstance({units: 'bla'})).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
                expect(createInstance({units: 'hours'})).to.throwException(/did you mean: hour/);
            });
        });
    });

    // INSTANCE METHODS

    describe('#resolvedOptions( )', function () {
        var rf;

        beforeEach(function () {
            rf = new IntlRelativeFormat();
        });

        it('should be a function', function () {
            expect(rf.resolvedOptions).to.be.a('function');
        });

        it('should contain `locale`, `style`, and `units` properties', function () {
            var resolvedOptions = rf.resolvedOptions();
            expect(resolvedOptions).to.have.keys(['locale', 'style', 'units']);
        });
    });

    describe('#format( [object] )', function () {
        var rf;

        beforeEach(function () {
            rf = new IntlRelativeFormat();
        });

        it('should be a function', function () {
            expect(rf.format).to.be.a('function');
        });

        it('should throw on non-dates', function () {
            expect(rf.format(now())).to.be.a('string');
            expect(rf.format(new Date())).to.be.a('string');
            expect(function () {
                return rf.format('foo');
            }).to.throwException();
        });

        it('should handle dates on and around the epoch', function () {
            expect(rf.format(1)).to.be.a('string');
            expect(rf.format(0)).to.be.a('string');
            expect(rf.format(-1)).to.be.a('string');
        });
    });

    describe('and relative time under the Spanish locale', function () {
        var rt = new IntlRelativeFormat('es');

        it('should return right now', function () {
            var output = rt.format(past());
            expect(output).to.equal('ahora');
        });

        it('should return 1 second past', function () {
            var output = rt.format(past(1000));
            expect(output).to.equal('hace 1 segundo');
        });

        it('should returun 10 second past', function () {
            var output = rt.format(past(10 * 1000));
            expect(output).to.equal('hace 10 segundos');
        });

        it('should return 2 minutes past', function () {
            var output = rt.format(past(2 * 60 * 1000));
            expect(output).to.equal('hace 2 minutos');
        });

        it('should return 2 minutes future', function () {
            var output = rt.format(future(2 * 60 * 1000));
            expect(output).to.equal('dentro de 2 minutos');
        });

        it('should return 10 seconds future', function () {
            var output = rt.format(future(10 * 1000));
            expect(output).to.equal('dentro de 10 segundos');
        });

        it('should return 1 seconds future', function () {
            var output = rt.format(future(1 * 1000));
            expect(output).to.equal('dentro de 1 segundo');
        });
    });

    describe('and relative time under the English locale', function () {
        var rt = new IntlRelativeFormat('en');

        it('should return right now', function () {
            var output = rt.format(past());
            expect(output).to.equal('now');
        });

        it('should return 1 second past', function () {
            var output = rt.format(past(1000));
            expect(output).to.equal('1 second ago');
        });

        it('should returun 10 second past', function () {
            var output = rt.format(past(10 * 1000));
            expect(output).to.equal('10 seconds ago');
        });

        it('should return 2 minutes past', function () {
            var output = rt.format(past(2 * 60 * 1000));
            expect(output).to.equal('2 minutes ago');
        });

        it('should return 1 hour past', function () {
            var output = rt.format(past(60 * 60 * 1000));
            expect(output).to.equal('1 hour ago');
        });

        it('should return 2 hours past', function () {
            var output = rt.format(past(2 * 60 * 60 * 1000));
            expect(output).to.equal('2 hours ago');
        });

        it('should return 1 day past', function () {
            var output = rt.format(past(24 * 60 * 60 * 1000));
            expect(output).to.equal('yesterday');
        });

        it('should return 2 days past', function () {
            var output = rt.format(past(2 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('2 days ago');
        });

        it('should return 1 month past', function () {
            var output = rt.format(past(30 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('last month');
        });

        it('should return 2 months past', function () {
            var output = rt.format(past(2 * 30 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('2 months ago');
        });

        it('should return 1 year past', function () {
            var output = rt.format(past(356 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('last year');
        });

        it('should return 2 years past', function () {
            var output = rt.format(past(2 * 365 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('2 years ago');
        });

        it('should return 2 years future', function () {
            var output = rt.format(future(2 * 365 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('in 2 years');
        });

        it('should return 1 year future', function () {
            var output = rt.format(future(356 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('next year');
        });

        it('should return 2 months future', function () {
            var output = rt.format(future(2 * 30 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('in 2 months');
        });

        it('should return 1 month future', function () {
            var output = rt.format(future(30 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('next month');
        });

        it('should return 2 days future', function () {
            var output = rt.format(future(2 * 24 * 60 * 60 * 1000));
            expect(output).to.equal('in 2 days');
        });

        it('should return 1 day future', function () {
            var output = rt.format(future(24 * 60 * 60 * 1000));
            expect(output).to.equal('tomorrow');
        });

        it('should return 2 minutes future', function () {
            var output = rt.format(future(2 * 60 * 1000));
            expect(output).to.equal('in 2 minutes');
        });

        it('should return 10 seconds future', function () {
            var output = rt.format(future(10 * 1000));
            expect(output).to.equal('in 10 seconds');
        });

        it('should return 1 second future', function () {
            var output = rt.format(future(1 * 1000));
            expect(output).to.equal('in 1 second');
        });
    });

    // INTERNAL FORMAT DELEGATION

    describe('internal format delegation', function () {
        it('should delegate the original `locales` value to internal formats', function () {
            // NOTE: This entire test case is a huge, huge hack to get at the
            // internals of IntlRelativeFormat, IntlMessageFormat, to finally
            // grab ahold of an Intl.NumberFormat instance to check its resolved
            // locale.

            var expected = new Intl.NumberFormat('en-GB').resolvedOptions();

            var rf = new IntlRelativeFormat('en-GB');
            var internalMF = rf._compileMessage('second');

            function checkInternalMessagePattern(pattern) {
                var subPattern = pattern[0].options.future[0].options.other[0];
                var resolved   = subPattern.numberFormat.resolvedOptions();

                expect(resolved.locale).to.equal(expected.locale);
            }

            // Override private method, which will expose the internal Message
            // Format pattern that we can traverse and check that its internal
            // Intl.NumberFormat pattern resolved the correct locale that was
            // originally passed to the IntlRelativeFormat instance.
            internalMF._format = checkInternalMessagePattern;
            internalMF.format({});
        });
    });

});
