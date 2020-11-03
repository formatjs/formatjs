import {
  IntlDateTimeFormatPart,
  IntlDateTimeFormatPartType,
  RangePatternType,
  TABLE_2,
} from '../../types/date-time';
import {SameValue, TimeClip} from '../../262';
import {ToLocalTime, ToLocalTimeImplDetails} from './ToLocalTime';
import {
  FormatDateTimePattern,
  FormatDateTimePatternImplDetails,
} from './FormatDateTimePattern';
import {PartitionPattern} from '../PartitionPattern';

const TABLE_2_FIELDS: Array<TABLE_2> = [
  'era',
  'year',
  'month',
  'day',
  'ampm',
  'hour',
  'minute',
  'second',
];

export function PartitionDateTimeRangePattern(
  dtf: Intl.DateTimeFormat,
  x: number,
  y: number,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
) {
  x = TimeClip(x);
  if (isNaN(x)) {
    throw new RangeError('Invalid start time');
  }
  y = TimeClip(y);
  if (isNaN(y)) {
    throw new RangeError('Invalid end time');
  }
  /** IMPL START */
  const {getInternalSlots, tzData} = implDetails;
  const internalSlots = getInternalSlots(dtf);
  /** IMPL END */
  const tm1 = ToLocalTime(
    x,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  );
  const tm2 = ToLocalTime(
    y,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  );
  const {pattern, rangePatterns} = internalSlots;
  let rangePattern;
  let dateFieldsPracticallyEqual = true;
  let patternContainsLargerDateField = false;

  for (const fieldName of TABLE_2_FIELDS) {
    if (dateFieldsPracticallyEqual && !patternContainsLargerDateField) {
      if (fieldName === 'ampm') {
        let v1 = tm1.hour;
        let v2 = tm2.hour;
        let rp = rangePatterns.ampm;
        if ((v1 > 11 && v2 < 11) || (v1 < 11 && v2 > 11)) {
          dateFieldsPracticallyEqual = false;
        }
        if (rangePattern !== undefined && rp === undefined) {
          patternContainsLargerDateField = true;
        }
        rangePattern = rp;
      } else {
        let v1 = tm1[fieldName];
        let v2 = tm2[fieldName];
        let rp = rangePatterns[fieldName];
        if (!SameValue(v1, v2)) {
          dateFieldsPracticallyEqual = false;
        }
        if (rangePattern !== undefined && rp === undefined) {
          patternContainsLargerDateField = true;
        }
        rangePattern = rp;
      }
    }
  }
  if (dateFieldsPracticallyEqual) {
    let result = FormatDateTimePattern(
      dtf,
      PartitionPattern<IntlDateTimeFormatPartType>(pattern),
      x,
      implDetails
    );
    for (const r of result) {
      r.source = RangePatternType.shared;
    }
    return result;
  }
  let result: IntlDateTimeFormatPart[] = [];
  if (rangePattern === undefined) {
    rangePattern = rangePatterns.default;
  }
  for (const rangePatternPart of rangePattern.patternParts) {
    const {source, pattern} = rangePatternPart;
    let z;
    if (
      source === RangePatternType.startRange ||
      source === RangePatternType.shared
    ) {
      z = x;
    } else {
      z = y;
    }
    const patternParts = PartitionPattern<IntlDateTimeFormatPartType>(pattern);
    let partResult = FormatDateTimePattern(dtf, patternParts, z, implDetails);
    for (const r of partResult) {
      r.source = source;
    }
    result = result.concat(partResult);
  }
  return result;
}
