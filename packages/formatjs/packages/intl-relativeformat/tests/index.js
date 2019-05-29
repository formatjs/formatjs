/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

const IntlRelativeFormat = require('../')

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

    // INSTANCE METHODS

    describe('#resolvedOptions()', function () {
        it('should be a function', function () {
            var rf = new IntlRelativeFormat();
            expect(rf.resolvedOptions).to.be.a('function');
        });

        it('should contain `locale`, `style`, and `units` properties', function () {
            var rf = new IntlRelativeFormat();
            expect(rf.resolvedOptions()).to.have.keys(['locale', 'style', 'units']);
        });

        describe('locale', function () {
            var IRFLocaleData = IntlRelativeFormat.__localeData__;
            var localeData    = {};

            // Helper to remove and replace the locale data available during the
            // the different tests.
            function transferLocaleData(from, to) {
                for (var locale in from) {
                    if (Object.prototype.hasOwnProperty.call(from, locale)) {
                        if (locale === IntlRelativeFormat.defaultLocale) {
                            continue;
                        }

                        to[locale] = from[locale];
                        delete from[locale];
                    }
                }
            }

            beforeEach(function () {
                transferLocaleData(IRFLocaleData, localeData);
            });

            afterEach(function () {
                transferLocaleData(localeData, IRFLocaleData);
            });

            it('should default to "en"', function () {
                var rf = new IntlRelativeFormat();
                expect(rf.resolvedOptions().locale).to.equal('en');
            });

            it('should normalize the casing', function () {
                transferLocaleData(localeData, IRFLocaleData);

                var rf = new IntlRelativeFormat('en-us');
                expect(rf.resolvedOptions().locale).to.equal('en-US');

                rf = new IntlRelativeFormat('EN-US');
                expect(rf.resolvedOptions().locale).to.equal('en-US');
            });

            it('should be a fallback value when data is missing', function () {
                IRFLocaleData.fr = localeData.fr;

                var rf = new IntlRelativeFormat('fr-FR');
                expect(rf.resolvedOptions().locale).to.equal('fr');

                rf = new IntlRelativeFormat('pt');
                expect(rf.resolvedOptions().locale).to.equal('en');
            });
        });

        describe('style', function () {
            it('should default to "best fit"', function () {
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

            it('should handle short unit formats', function () {
                var rf = new IntlRelativeFormat('en', {units: 'minute-short'});

                expect(rf.format(now())).to.equal('this minute');
                expect(rf.format(past(24 * 60 * 60 * 1000))).to.equal('1,440 min. ago');
                expect(rf.format(past(30 * 24 * 60 * 60 * 1000))).to.equal('43,200 min. ago');
                expect(rf.format(future(24 * 60 * 60 * 1000))).to.equal('in 1,440 min.');
                expect(rf.format(future(30 * 24 * 60 * 60 * 1000))).to.equal('in 43,200 min.');
            });

            it('should validate the specified units', function () {
                function createInstance(options) {
                    return function () {
                        return new IntlRelativeFormat('en', options);
                    };
                }

                expect(createInstance({units: 'bla'})).to.throw();
                expect(createInstance({units: 'hours'})).to.throw(/did you mean: hour/);
            });
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
            }).to.throw();
        });

        it('should handle dates on and around the epoch', function () {
            expect(rf.format(1)).to.be.a('string');
            expect(rf.format(0)).to.be.a('string');
            expect(rf.format(-1)).to.be.a('string');
        });

        describe('with "es" locale', function () {
            var rf = new IntlRelativeFormat('es');

            it('should return right now', function () {
                var output = rf.format(past());
                expect(output).to.equal('ahora');
            });

            it('should return 1 second past', function () {
                var output = rf.format(past(1000));
                expect(output).to.equal('hace 1 segundo');
            });

            it('should return 10 second past', function () {
                var output = rf.format(past(10 * 1000));
                expect(output).to.equal('hace 10 segundos');
            });

            it('should return 2 minutes past', function () {
                var output = rf.format(past(2 * 60 * 1000));
                expect(output).to.equal('hace 2 minutos');
            });

            it('should return 2 minutes future', function () {
                var output = rf.format(future(2 * 60 * 1000));
                expect(output).to.equal('dentro de 2 minutos');
            });

            it('should return 10 seconds future', function () {
                var output = rf.format(future(10 * 1000));
                expect(output).to.equal('dentro de 10 segundos');
            });

            it('should return 1 seconds future', function () {
                var output = rf.format(future(1 * 1000));
                expect(output).to.equal('dentro de 1 segundo');
            });

            it('should accept a custom value for now', function() {
                var now = 1425839825400;
                var output = rf.format(new Date(now-(60 * 1000)), {now: new Date(now)});
                expect(output).to.equal('hace 1 minuto');
            });
        });

        describe('with "en" locale', function () {
            var rf = new IntlRelativeFormat('en');

            it('should return right now', function () {
                var output = rf.format(past());
                expect(output).to.equal('now');
            });

            it('should return 1 second past', function () {
                var output = rf.format(past(1000));
                expect(output).to.equal('1 second ago');
            });

            it('should return 10 second past', function () {
                var output = rf.format(past(10 * 1000));
                expect(output).to.equal('10 seconds ago');
            });

            it('should return 2 minutes past', function () {
                var output = rf.format(past(2 * 60 * 1000));
                expect(output).to.equal('2 minutes ago');
            });

            it('should return 1 hour past', function () {
                var output = rf.format(past(60 * 60 * 1000));
                expect(output).to.equal('1 hour ago');
            });

            it('should return 2 hours past', function () {
                var output = rf.format(past(2 * 60 * 60 * 1000));
                expect(output).to.equal('2 hours ago');
            });

            it('should return 1 day past', function () {
                var output = rf.format(past(24 * 60 * 60 * 1000));
                expect(output).to.equal('yesterday');
            });

            it('should return 2 days past', function () {
                var output = rf.format(past(2 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('2 days ago');
            });

            it('should return 1 month past', function () {
                var output = rf.format(past(30 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('last month');
            });

            it('should return 2 months past', function () {
                var output = rf.format(past(2 * 30 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('2 months ago');
            });

            it('should return 1 year past', function () {
                var output = rf.format(past(356 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('last year');
            });

            it('should return 2 years past', function () {
                var output = rf.format(past(2 * 365 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('2 years ago');
            });

            it('should return 2 years future', function () {
                var output = rf.format(future(2 * 365 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('in 2 years');
            });

            it('should return 1 year future', function () {
                var output = rf.format(future(356 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('next year');
            });

            it('should return 2 months future', function () {
                var output = rf.format(future(2 * 30 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('in 2 months');
            });

            it('should return 1 month future', function () {
                var output = rf.format(future(30 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('next month');
            });

            it('should return 2 days future', function () {
                var output = rf.format(future(2 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('in 2 days');
            });

            it('should return 1 day future', function () {
                var output = rf.format(future(24 * 60 * 60 * 1000));
                expect(output).to.equal('tomorrow');
            });

            it('should return 2 minutes future', function () {
                var output = rf.format(future(2 * 60 * 1000));
                expect(output).to.equal('in 2 minutes');
            });

            it('should return 10 seconds future', function () {
                var output = rf.format(future(10 * 1000));
                expect(output).to.equal('in 10 seconds');
            });

            it('should return 1 second future', function () {
                var output = rf.format(future(1 * 1000));
                expect(output).to.equal('in 1 second');
            });

            it('should accept a custom value for now', function() {
                var now = 1425839825400;
                var output = rf.format(new Date(now-(60 * 1000)), {now: new Date(now)});
                expect(output).to.equal('1 minute ago');
            });
        });

        describe('with "zh" locale', function () {
            var rf = new IntlRelativeFormat('zh');

            it('should return right now', function () {
                var output = rf.format(now());
                expect(output).to.equal('现在');
            });

            it('should return 1 second past', function () {
                var output = rf.format(past(1000));
                expect(output).to.equal('1秒钟前');
            });

            it('should return 10 seconds future', function () {
                var output = rf.format(future(10 * 1000));
                expect(output).to.equal('10秒钟后');
            });

            it('should return 3 minutes past', function () {
                var output = rf.format(past(3 * 60 * 1000));
                expect(output).to.equal('3分钟前');
            });

            it('should return 3 minutes future', function () {
                var output = rf.format(future(3 * 60 * 1000));
                expect(output).to.equal('3分钟后');
            });

            it('should return yesterday', function () {
                var output = rf.format(past(1 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('昨天');
            });

            it('should return 2 days future', function () {
                var output = rf.format(future(2 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('后天');
            });
        });

        describe('with "zh-Hant-TW" locale', function () {
            var rf = new IntlRelativeFormat('zh-Hant-TW');

            it('should return right now', function () {
                var output = rf.format(now());
                expect(output).to.equal('現在');
            });

            it('should return 1 second past', function () {
                var output = rf.format(past(1000));
                expect(output).to.equal('1 秒前');
            });

            it('should return 10 seconds future', function () {
                var output = rf.format(future(10 * 1000));
                expect(output).to.equal('10 秒後');
            });

            it('should return 3 minutes past', function () {
                var output = rf.format(past(3 * 60 * 1000));
                expect(output).to.equal('3 分鐘前');
            });

            it('should return 3 minutes future', function () {
                var output = rf.format(future(3 * 60 * 1000));
                expect(output).to.equal('3 分鐘後');
            });

            it('should return yesterday', function () {
                var output = rf.format(past(1 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('昨天');
            });

            it('should return 2 days future', function () {
                var output = rf.format(future(2 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('後天');
            });
        });

        describe('with "zh-Hant-HK" locale', function () {
            var rf = new IntlRelativeFormat('zh-Hant-HK');

            it('should return right now', function () {
                var output = rf.format(now());
                expect(output).to.equal('現在');
            });

            it('should return 1 second past', function () {
                var output = rf.format(past(1000));
                expect(output).to.equal('1 秒前');
            });

            it('should return 10 seconds future', function () {
                var output = rf.format(future(10 * 1000));
                expect(output).to.equal('10 秒後');
            });

            it('should return 3 minutes past', function () {
                var output = rf.format(past(3 * 60 * 1000));
                expect(output).to.equal('3 分鐘前');
            });

            it('should return 3 minutes future', function () {
                var output = rf.format(future(3 * 60 * 1000));
                expect(output).to.equal('3 分鐘後');
            });

            it('should return yesterday', function () {
                var output = rf.format(past(1 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('昨日');
            });

            it('should return 2 days future', function () {
                var output = rf.format(future(2 * 24 * 60 * 60 * 1000));
                expect(output).to.equal('後日');
            });
        });

        describe('with `now` option', function () {
            var rf = new IntlRelativeFormat('en');

            it('should accept the epoch value', function () {
                var output = rf.format(new Date(60000), {now: 0});
                expect(output).to.equal('in 1 minute');
            });

            it('should use the real value of now when undefined', function () {
                var output = rf.format(past(2 * 60 * 1000), {now: undefined});
                expect(output).to.equal('2 minutes ago');
            });

            it('should throw on non-finite values', function() {
                expect(function () {
                    rf.format(past(2 * 60 * 1000), {now: Infinity});
                }).to.throw();
            });

            it('should treat null like the epoch', function () {
                var output = rf.format(new Date(120000), {now: null});
                expect(output).to.equal('in 2 minutes');
            });
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
