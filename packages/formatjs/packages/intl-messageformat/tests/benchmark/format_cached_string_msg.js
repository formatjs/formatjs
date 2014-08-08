'use strict';

global.Intl || require('intl');

var IntlMessageFormat = require('../../');

var msg = 'Hello, world!';

var mf = new IntlMessageFormat(msg, 'en-US');

module.exports = function () {
    mf.format();
};
