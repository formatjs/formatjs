'use strict';

var ts = new Date().getTime() - 1001;

var moment = require('moment');

module.exports = function () {
    moment(ts).fromNow();
};
