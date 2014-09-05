'use strict';

var ts = new Date().getTime() - 366 * 24 * 60 * 30 * 1000;

var moment = require('moment');

module.exports = function () {
    moment(ts).fromNow();
};
