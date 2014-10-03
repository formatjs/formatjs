if (typeof global.Intl === 'undefined'){
    global.Intl = require('intl');
}

global.IntlRelativeFormat = require('../');
global.expect = require('expect.js');

require('./index');
