if (typeof global.Intl === 'undefined'){
    global.Intl = require('intl');
}

global.IntlRelativeFormat = require('../');
global.expect = require('chai').expect;

require('./index');
