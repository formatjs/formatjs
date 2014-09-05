'use strict';

global.Intl || require('intl');

var IntlRelativeFormat = require('../../');

module.exports = function () {
    new IntlRelativeFormat('en');
};
