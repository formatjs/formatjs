'use strict';

var IntlRelativeFormat = require('../../');

var o = new IntlRelativeFormat('en');

var ts = new Date().getTime() - 366 * 24 * 60 * 30 * 1000;

module.exports = function () {
    o.format(ts);
};
