'use strict';

global.Intl || require('intl');

var IntlMessageFormat = require('../../');

var msg = 'Hello, world!';

module.exports = function () {
    new IntlMessageFormat(msg, 'en-US');
};
