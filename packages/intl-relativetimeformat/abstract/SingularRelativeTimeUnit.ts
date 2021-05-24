import {
  invariant,
  RelativeTimeFormatSingularUnit,
  Type,
} from '@formatjs/ecma402-abstract'

/**
 * https://tc39.es/proposal-intl-relative-time/#sec-singularrelativetimeunit
 * @param unit
 */
export function SingularRelativeTimeUnit(
  unit: Intl.RelativeTimeFormatUnit
): RelativeTimeFormatSingularUnit {
  invariant(Type(unit) === 'String', 'unit must be a string')
  if (unit === 'seconds') return 'second'
  if (unit === 'minutes') return 'minute'
  if (unit === 'hours') return 'hour'
  if (unit === 'days') return 'day'
  if (unit === 'weeks') return 'week'
  if (unit === 'months') return 'month'
  if (unit === 'quarters') return 'quarter'
  if (unit === 'years') return 'year'
  if (
    unit !== 'second' &&
    unit !== 'minute' &&
    unit !== 'hour' &&
    unit !== 'day' &&
    unit !== 'week' &&
    unit !== 'month' &&
    unit !== 'quarter' &&
    unit !== 'year'
  ) {
    throw new RangeError('invalid unit')
  }
  return unit
}
