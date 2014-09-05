'use strict';

global.Intl || require('intl');

var IntlRelativeFormat = require('../../');

var o = new IntlRelativeFormat('en');

var ts = new Date().getTime() - 1001;

module.exports = function () {
    o.format(ts);
};
