/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

var round = Math.round;

function absRound(number) {
    return Math[number < 0 ? 'ceil' : 'floor'](number);
}

function daysToYears (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return days * 400 / 146097;
}

export default function (dfrom, dto) {
    var duration    = absRound(dto.getTime() - dfrom.getTime()),
        millisecond = Math.abs(duration),
        second      = round(millisecond / 1000),
        minute      = round(second / 60),
        hour        = round(minute / 60),
        day         = round(hour / 24),
        week        = round(day / 7);

    var rawYears = daysToYears(day),
        month    = round(rawYears * 12),
        year     = round(rawYears);

    return {
        duration   : duration,
        year       : year,
        month      : month,
        week       : week,
        day        : day,
        hour       : hour,
        minute     : minute,
        second     : second,
        millisecond: millisecond
    };
}
