import { Unit } from '@formatjs/intl-relativetimeformat';
import {
  differenceInCalendarDays,
  differenceInCalendarQuarters,
  differenceInCalendarYears,
  differenceInSeconds,
  differenceInCalendarMonths,
  differenceInCalendarWeeks
} from 'date-fns';

export function selectUnit(
  from: Date | number,
  to: Date | number = Date.now(),
  thresholds = DEFAULT_THRESHOLDS
): { value: number; unit: Unit } {
  const secs = differenceInSeconds(from, to);
  if (Math.abs(secs) < thresholds.second) {
    return {
      value: Math.round(secs),
      unit: 'second'
    };
  }
  const mins = secs / 60;
  if (Math.abs(mins) < thresholds.minute) {
    return {
      value: Math.round(mins),
      unit: 'minute'
    };
  }
  const hours = mins / 60;
  if (Math.abs(hours) < thresholds.hour) {
    return {
      value: Math.round(hours),
      unit: 'hour'
    };
  }

  const years = differenceInCalendarYears(from, to);
  if (Math.abs(years) > 0) {
    return {
      value: Math.round(years),
      unit: 'year'
    };
  }
  const quarters = differenceInCalendarQuarters(from, to);
  if (Math.abs(quarters) > 0) {
    return {
      value: Math.round(quarters),
      unit: 'quarter'
    };
  }
  const months = differenceInCalendarMonths(from, to);
  if (Math.abs(months) > 0) {
    return {
      value: Math.round(months),
      unit: 'month'
    };
  }
  const weeks = differenceInCalendarWeeks(from, to);
  if (Math.abs(weeks) > 0) {
    return {
      value: Math.round(weeks),
      unit: 'week'
    };
  }
  const days = differenceInCalendarDays(from, to);
  return {
    value: Math.round(days),
    unit: 'day'
  };
}

export const DEFAULT_THRESHOLDS: Record<
  'second' | 'minute' | 'hour',
  number
> = {
  second: 45, // seconds to minute
  minute: 45, // minutes to hour
  hour: 22 // hour to day
};
