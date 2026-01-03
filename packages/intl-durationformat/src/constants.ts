import {type DurationRecord} from './types.js'

export const TABLE_1: Array<keyof DurationRecord> = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
]

export const TABLE_2 = [
  {
    valueField: 'years',
    styleSlot: 'years',
    displaySlot: 'yearsDisplay',
    unit: 'years',
    numberFormatUnit: 'year',
  },
  {
    valueField: 'months',
    styleSlot: 'months',
    displaySlot: 'monthsDisplay',
    unit: 'months',
    numberFormatUnit: 'month',
  },
  {
    valueField: 'weeks',
    styleSlot: 'weeks',
    displaySlot: 'weeksDisplay',
    unit: 'weeks',
    numberFormatUnit: 'week',
  },
  {
    valueField: 'days',
    styleSlot: 'days',
    displaySlot: 'daysDisplay',
    unit: 'days',
    numberFormatUnit: 'day',
  },
  {
    valueField: 'hours',
    styleSlot: 'hours',
    displaySlot: 'hoursDisplay',
    unit: 'hours',
    numberFormatUnit: 'hour',
  },
  {
    valueField: 'minutes',
    styleSlot: 'minutes',
    displaySlot: 'minutesDisplay',
    unit: 'minutes',
    numberFormatUnit: 'minute',
  },
  {
    valueField: 'seconds',
    styleSlot: 'seconds',
    displaySlot: 'secondsDisplay',
    unit: 'seconds',
    numberFormatUnit: 'second',
  },
  {
    valueField: 'milliseconds',
    styleSlot: 'milliseconds',
    displaySlot: 'millisecondsDisplay',
    unit: 'milliseconds',
    numberFormatUnit: 'millisecond',
  },
  {
    valueField: 'microseconds',
    styleSlot: 'microseconds',
    displaySlot: 'microsecondsDisplay',
    unit: 'microseconds',
    numberFormatUnit: 'microsecond',
  },
  {
    valueField: 'nanoseconds',
    styleSlot: 'nanoseconds',
    displaySlot: 'nanosecondsDisplay',
    unit: 'nanoseconds',
    numberFormatUnit: 'nanosecond',
  },
] as const
