'use strict';

var parser = require('../../');

var msg = 'Hello, world!';

module.exports = function () {
    parser.parse(msg);
};
