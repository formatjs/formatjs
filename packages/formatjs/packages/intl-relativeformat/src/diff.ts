import { FIELD } from './types';

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

function daysToYears(days: number) {
  // 400 years have 146097 days (taking into account leap year rules)
  return (days * 400) / 146097;
}

// Thanks to date-fns
// https://github.com/date-fns/date-fns
// MIT © Sasha Koss

const MILLISECONDS_IN_MINUTE = 60000;
const MILLISECONDS_IN_DAY = 86400000;

function startOfDay(dirtyDate: ConstructorParameters<typeof Date>[0]) {
  var date = new Date(dirtyDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

function differenceInCalendarDays(
  dirtyDateLeft: Parameters<typeof startOfDay>[0],
  dirtyDateRight: Parameters<typeof startOfDay>[0]
) {
  var startOfDayLeft = startOfDay(dirtyDateLeft);
  var startOfDayRight = startOfDay(dirtyDateRight);

  var timestampLeft =
    startOfDayLeft.getTime() -
    startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
  var timestampRight =
    startOfDayRight.getTime() -
    startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
}

export default function diff(
  from: Date | number,
  to: Date | number
): Record<FIELD, number> {
  // Convert to ms timestamps.
  from = +from;
  to = +to;

  var millisecond = Math.round(to - from),
    second = Math.round(millisecond / 1000),
    minute = Math.round(second / 60),
    hour = Math.round(minute / 60);

  // We expect a more precision in rounding when dealing with
  // days as it feels wrong when something happended 13 hours ago and
  // is regarded as "yesterday" even if the time was this morning.

  var day = differenceInCalendarDays(to, from);
  var week = Math.round(day / 7);

  var rawYears = daysToYears(day),
    month = Math.round(rawYears * 12),
    year = Math.round(rawYears);

  return {
    second,
    'second-short': second,
    'second-narrow': second,
    minute,
    'minute-short': minute,
    'minute-narrow': minute,
    hour,
    'hour-short': hour,
    'hour-narrow': hour,
    day,
    'day-short': day,
    'day-narrow': day,
    week,
    'week-short': week,
    'week-narrow': week,
    month,
    'month-short': month,
    'month-narrow': month,
    year,
    'year-short': year,
    'year-narrow': year
  };
}
