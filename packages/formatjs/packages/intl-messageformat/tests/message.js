/*jshint node:true */
/*global describe,it */
'use strict';


var expect = require('chai').expect,
    MessageFormatter = require('../lib/message.js');


describe('message creation', function () {

    it('simple string formatting', function () {
        var msg, m;
        msg = new MessageFormatter(null, 'My name is ${first} {last}.');
        m = msg.format({
            first: 'Anthony',
            last: 'Pipkin'
        });
        expect(m).to.equal('My name is Anthony Pipkin.');
    });


    it ('complex object formatter', function () {
        var msg, m;
        msg = new MessageFormatter(null, ['Some text before ', {
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
        msg = new MessageFormatter(null, 'Test formatter d: ${num:d}', {
            d: function (locale, val) {
                return +val;
            }
        });
        m = msg.format({
            num: '010'
        });
        expect(m).to.equal('Test formatter d: 10');
    });

});


