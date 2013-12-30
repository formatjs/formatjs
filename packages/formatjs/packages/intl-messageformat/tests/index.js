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

    delete global.IntlMessageFormat;

    chai = require('chai');

    IntlMessageFormat = require('../build/index.en.min.js');

    require('../locale-data/en.js');
    require('../locale-data/ar.js');
    require('../locale-data/pl.js');

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
            var err = new ReferenceError('The valueName `numPeople` was not found.');
            expect(e.toString()).to.equal(err.toString());
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

                other: 'Some messages for the default'

            }
        }, ' and text after'],
            'pl'    // this has the "few" rule that we need
        );
        m = msg.format({
            numPeople: 1,   // offset will move this to "2" so that the "few" group is used
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
        }, '.'], 'ar');

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


describe('locale switching', function () {
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
                    valueName: 'gender',
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
            en: '${TRAVELLERS} went to ${CITY}.',
            fr: [
                '${TRAVELLERS}',
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
                '${CITY}',
                '.'
            ]
        },

        maleObj = {
            NAME: 'Tony',
            CITY: 'Paris',
            gender: 'male'
        },
        femaleObj = {
            NAME: 'Jenny',
            CITY: 'Paris',
            gender: 'female'
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

    it('en-US simple', function () {
        var msg = new IntlMessageFormat(simple.en, 'en-US');

        expect(msg.format(maleObj)).to.equal('Tony went to Paris.');

        expect(msg.format(femaleObj)).to.equal('Jenny went to Paris.');
    });


    it('fr-FR simple', function () {
        var msg = new IntlMessageFormat(simple.fr, 'fr-FR');

        expect(msg.format(maleObj)).to.equal('Tony est allé à Paris.');

        expect(msg.format(femaleObj)).to.equal('Jenny est allée à Paris.');
    });

    it('en-US complex', function () {
        var msg = new IntlMessageFormat(complex.en, 'en-US');

        expect(msg.format(maleTravelers)).to.equal('Lucas, Tony and Drew went to Paris.');

        expect(msg.format(femaleTravelers)).to.equal('Monica went to Paris.');
    });


    it('fr-FR complex', function () {
        var msg = new IntlMessageFormat(complex.fr, 'fr-FR');

        expect(msg.format(maleTravelers)).to.equal('Lucas, Tony and Drew sont allés à Paris.');

        expect(msg.format(femaleTravelers)).to.equal('Monica est allée à Paris.');
    });


});

describe('locale switching with counts', function () {

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

    it('en-US', function () {
        var msg = new IntlMessageFormat(messages.en, 'en-US');

        expect(msg.format({COMPANY_COUNT: 0})).to.equal('0 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 1})).to.equal('One company published new books.');

        expect(msg.format({COMPANY_COUNT: 2})).to.equal('2 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 5})).to.equal('5 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 10})).to.equal('10 companies published new books.');
    });

    it('ru-RU', function () {
        var msg = new IntlMessageFormat(messages.ru, 'ru-RU');

        expect(msg.format({COMPANY_COUNT: 0})).to.equal('0 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 1})).to.equal('Одна компания опубликовала новые книги.');

        expect(msg.format({COMPANY_COUNT: 2})).to.equal('2 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 5})).to.equal('5 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 10})).to.equal('10 компаний опубликовали новые книги.');
    });

});



//------------------------------------------------
//
//====== CAUTION: PURGING BEYOND THIS POINT ======
//
//------------------------------------------------


describe('no locale provided', function () {
    it('no locale', function () {
        try {
            IntlMessageFormat.__purge();

            var msg = new IntlMessageFormat(['I have ', {
                type: 'plural',
                valueName: 'NUM_BOOKS',
                options: {
                    one: '1 book',
                    other: '${#} books'
                }
            }, '.']);

            var m = msg.format({ NUM_BOOKS: 2 });

            // always fail if we didn't throw
            expect(false).to.equal(true);

        } catch (e) {
            var err = new ReferenceError('No locale data has been provided for this object yet.');
            expect(e.toString()).to.equal(err.toString());
        }
    });
});

describe('no default', function () {
    it('blind switching', function () {
        var msg = new IntlMessageFormat([{
                type: 'plural',
                valueName: 'COMPANY_COUNT',
                options: {
                   one: 'One company',
                   other: '${#} companies'
                }
            },
            ' published new books.'
        ]);

        // let's set the locale to something witout data
        IntlMessageFormat.__addLocaleData({locale: 'fu-baz'});
        msg.locale = 'fu-baz';

        var m = msg.format({ COMPANY_COUNT: 1});

        expect(m).to.equal('1 companies published new books.');
    });

    it('update locale', function () {
        IntlMessageFormat.__purge();

        // let's set the locale to something witout data
        IntlMessageFormat.__addLocaleData({
            locale: 'fu-baz',
            messageformat: {
                pluralFunction: function (count) { return null; }
            }
        });

        var msg = new IntlMessageFormat([{
                type: 'plural',
                valueName: 'COMPANY_COUNT',
                options: {
                   one: 'One company',
                   other: '${#} companies'
                }
            },
            ' published new books.'
        ]);

        var m = msg.format({ COMPANY_COUNT: 1});

        expect(m).to.equal('1 companies published new books.');
    });
});


