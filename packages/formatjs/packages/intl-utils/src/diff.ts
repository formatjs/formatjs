import {
  differenceInCalendarDays,
  differenceInCalendarQuarters,
  differenceInCalendarYears,
  differenceInSeconds,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
} from 'date-fns';

export declare type Unit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

export function selectUnit(
  from: Date | number,
  to: Date | number = Date.now(),
  thresholds: Partial<Thresholds> = {}
): {value: number; unit: Unit} {
  const resolvedThresholds: Thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(thresholds || {}),
  };
  const secs = differenceInSeconds(from, to);
  if (Math.abs(secs) < resolvedThresholds.second) {
    return {
      value: Math.round(secs),
      unit: 'second',
    };
  }
  const mins = secs / 60;
  if (Math.abs(mins) < resolvedThresholds.minute) {
    return {
      value: Math.round(mins),
      unit: 'minute',
    };
  }
  const hours = mins / 60;
  if (Math.abs(hours) < resolvedThresholds.hour) {
    return {
      value: Math.round(hours),
      unit: 'hour',
    };
  }

  const years = differenceInCalendarYears(from, to);
  if (Math.abs(years) > 0) {
    return {
      value: Math.round(years),
      unit: 'year',
    };
  }

  if (resolvedThresholds.quarter) {
    const quarters = differenceInCalendarQuarters(from, to);
    if (Math.abs(quarters) > 0) {
      return {
        value: Math.round(quarters),
        unit: 'quarter',
      };
    }
  }

  const months = differenceInCalendarMonths(from, to);
  if (Math.abs(months) > 0) {
    return {
      value: Math.round(months),
      unit: 'month',
    };
  }
  const weeks = differenceInCalendarWeeks(from, to);
  if (Math.abs(weeks) > 0) {
    return {
      value: Math.round(weeks),
      unit: 'week',
    };
  }
  const days = differenceInCalendarDays(from, to);
  return {
    value: Math.round(days),
    unit: 'day',
  };
}

type Thresholds = Record<
  'second' | 'minute' | 'hour' | 'quarter',
  number | boolean
>;

export const DEFAULT_THRESHOLDS: Thresholds = {
  second: 45, // seconds to minute
  minute: 45, // minutes to hour
  hour: 22, // hour to day
  quarter: false,
};
