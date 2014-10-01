/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

var round = Math.round;

function daysToYears (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return days * 400 / 146097;
}

export default function (dfrom, dto) {
    // Convert to ms timestamps.
    dfrom = +dfrom;
    dto   = +dto;

    var millisecond = round(dto - dfrom),
        second      = round(millisecond / 1000),
        minute      = round(second / 60),
        hour        = round(minute / 60),
        day         = round(hour / 24),
        week        = round(day / 7);

    var rawYears = daysToYears(day),
        month    = round(rawYears * 12),
        year     = round(rawYears);

    return {
        millisecond: millisecond,
        second     : second,
        minute     : minute,
        hour       : hour,
        day        : day,
        week       : week,
        month      : month,
        year       : year
    };
}
