'use strict';

if (!global.Intl) {
    global.Intl = require('intl');
}

global.expect                   = require('expect');
global.memoizeFormatConstructor = require('../..');

global.IntlMessageFormat  = require('intl-messageformat');
global.IntlRelativeFormat = require('intl-relativeformat');
