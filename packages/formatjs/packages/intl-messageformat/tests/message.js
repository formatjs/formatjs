/**
The MIT License (MIT)

Copyright (c) 2013 Yahoo! Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
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


