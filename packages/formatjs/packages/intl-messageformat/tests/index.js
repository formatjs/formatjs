/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it */
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
}
expect = chai.expect;


describe('message resolvedOptions', function () {

    it('empty options', function () {
        var msg, o, p, pCount = 0;

        msg = new IntlMessageFormat('My name is ${name}');

        o = msg.resolvedOptions();

        for (p in o) {
            if (o.hasOwnProperty(p)) {
                pCount++;
            }
        }

        expect(pCount).to.equal(0);
    });
});

describe('message creation', function () {

    it('simple string formatting', function () {
        var msg, m;
        msg = new IntlMessageFormat('My name is ${first} {last}.');
        m = msg.format({
            first: 'Anthony',
            last: 'Pipkin'
        });
        expect(m).to.equal('My name is Anthony Pipkin.');
    });

    it('simple object formatting', function () {
        var msg, m;

        msg = new IntlMessageFormat(['I have ', 2, ' cars.']);

        m = msg.format();

        expect(m).to.equal('I have 2 cars.');

    });

    it('simple object with post processing tokens', function () {
        var msg, m;

        msg = new IntlMessageFormat(['${', 'company', '}', ' {', 'verb' ,'}.']);

        m = msg.format({
            company: 'Yahoo',
            verb: 'rocks'
        });

        expect(m).to.equal('Yahoo rocks.');

    });

    it ('complex object formatter', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
            type: 'plural',
            valueName: 'numPeople',
            options: {
                one: 'one',

                few: 'few',

                other: 'Some messages for the default'
            }
        }, ' and text after']);

        m = msg.format({
            numPeople: 20
        });

        expect(m).to.equal("Some text before Some messages for the default and text after");
    });

    it ('complex object formatter with invalid valueName', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
            type: 'plural',
            valueName: 'numPeople',
            options: {
                one: 'one',

                few: 'few',

                other: 'Some messages for the default'
            }
        }, ' and text after']);

        try {
            m = msg.format({
                jumper: 20
            });
        } catch (e) {
            var err = 'The valueName `numPeople` was not found.';
            expect(e).to.equal(err);
        }


    });

    it ('complex object formatter with offset', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
            type: 'plural',
            valueName: 'numPeople',
            offset: 1,
            options: {
                one: 'Some message ${ph} with ${#} value',

                few: ['Optional prefix text for |few| ', {
                    type: 'select',
                    valueName: 'gender',
                    options: {
                        male: 'Text for male option with \' single quotes',
                        female: 'Text for female option with {}',
                        other: 'Text for default'
                    }
                }, ' optional postfix text'],

                other: 'Some messages for the default',

                    '1': ['Optional prefix text ', {
                    type: 'select',
                    valueName: 'gender',
                    options: {
                        male: 'Text for male option with \' single quotes',
                        female: 'Text for female option with {}',
                        other: 'Text for default'
                    }
                }, ' optional postfix text'],
            }
        }, ' and text after']);
        m = msg.format({
            numPeople: 4,
            ph: 'whatever',
            gender: 'male'
        });
        expect(m).to.equal("Some text before Optional prefix text for |few| Text for male option with ' single quotes optional postfix text and text after");
    });


    it('Simple string formatter using a custom formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat('Test formatter d: ${num:d}', null, {
            d: function (val, locale) {
                return +val;
            }
        });
        m = msg.format({
            num: '010'
        });
        expect(m).to.equal('Test formatter d: 10');
    });

    it('Simple string formatter using an inline formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat([{
            valueName: 'str',
            formatter: function (val, locale) {
                return val.toString().split('').reverse().join('');
            }
        }]);
        m = msg.format({
            str: 'aardvark'
        });
        expect(m).to.equal('kravdraa');
    });

    it('Simple string formatter using a nonexistent formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat('Test formatter foo: ${num:foo}', null, {
            d: function (val, locale) {
                return +val;
            }
        });
        m = msg.format({
            num: '010'
        });
        expect(m).to.equal('Test formatter foo: 010');
    });


    it('Custom formatters with hidden inheritance', function () {
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


        msg = new IntlMessageFormat('d: ${num:d} / f: ${num:f}', null, new CustomFormatters());

        m = msg.format({
            num: 0
        });

        expect(m).to.equal('d: 0 / f: 0080');
    });

    it('broken pattern', function () {
       var msg, m;

        msg = new IntlMessageFormat('${name} ${formula}');

        msg.pattern = '${name} ${formula}';

        m = msg.format({
            name: 'apipkin'
        });

        expect(m).to.equal('apipkin ${formula}');

    });

});


describe('message creation for plurals', function () {
    var msg = new IntlMessageFormat(['I have ', {
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
        }, '.']);

    it('zero', function () {
        var m = msg.format({
            numPeople: 0
        });

        expect(m).to.equal('I have zero points.');
    });

    it('one', function () {
        var m = msg.format({
            numPeople: 1
        });

        expect(m).to.equal('I have a point.');
    });

    it('two', function () {
        var m = msg.format({
            numPeople: 2
        });

        expect(m).to.equal('I have two points.');
    });

    it('few', function () {
        var m = msg.format({
            numPeople: 5
        });

        expect(m).to.equal('I have a few points.');
    });

    it('many', function () {
        var m = msg.format({
            numPeople: 20
        });

        expect(m).to.equal('I have lots of points.');
    });

    it('other', function () {
        var m = msg.format({
            numPeople: 100
        });

        expect(m).to.equal('I have some other amount of points.');
    });


});

