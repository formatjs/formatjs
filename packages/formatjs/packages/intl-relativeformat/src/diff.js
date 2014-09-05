/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

function absRound(number) {
    return Math[number < 0 ? 'ceil' : 'floor'](number);
}

function daysToYears (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return days * 400 / 146097;
}

export default function (dfrom, dto) {
    var round = Math.round,
        duration = absRound(dto.getTime() - dfrom.getTime()),
        ms = Math.abs(duration),
        ss = round(ms / 1000),
        mm = round(ss / 60),
        hh = round(mm / 60),
        dd = round(hh / 24),
        ww = round(dd / 7);

    return {
        duration: duration,
        week: ww,
        day: dd,
        hour: hh,
        minute: mm,
        second: ss,
        millisecond: ms,
        year: round((mm + daysToYears(dd) * 12) / 12),
        month: round(mm + daysToYears(dd) * 12),
    };
}
