'use strict';

var parser = require('../../');

var msg = 'Hello, {name}!';

module.exports = function () {
    parser.parse(msg);
};
