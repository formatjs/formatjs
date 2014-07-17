'use strict';

var parser = require('../../');

var msg = '' +
    'Yo, {firstName} {lastName} has ' +
    '{numBooks, number, integer} ' +
    '{numBooks, plural, ' +
        'one {book} ' +
        'other {books}}.';

module.exports = function () {
    parser.parse(msg);
};
