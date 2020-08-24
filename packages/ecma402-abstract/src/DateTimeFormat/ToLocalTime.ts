import {invariant} from '../utils';
import Type from 'es-abstract/2019/Type';
import YearFromTime from 'es-abstract/2019/YearFromTime';
import WeekDay from 'es-abstract/2019/WeekDay';
import MonthFromTime from 'es-abstract/2019/MonthFromTime';
import DateFromTime from 'es-abstract/2019/DateFromTime';
import HourFromTime from 'es-abstract/2019/HourFromTime';
import MinFromTime from 'es-abstract/2019/MinFromTime';
import SecFromTime from 'es-abstract/2019/SecFromTime';
import {UnpackedZoneData} from '../../types/date-time';

function getApplicableZoneData(
  t: number,
  timeZone: string,
  tzData: Record<string, UnpackedZoneData[]>
): [number, boolean] {
  const zoneData = tzData[timeZone];
  // We don't have data for this so just say it's UTC
  if (!zoneData) {
    return [0, false];
  }
  let i = 0;
  let offset = 0;
  let dst = false;
  for (; i <= zoneData.length; i++) {
    if (i === zoneData.length || zoneData[i][0] * 1e3 >= t) {
      [, , offset, dst] = zoneData[i - 1];
      break;
    }
  }
  return [offset * 1e3, dst];
}

/**
 * https://tc39.es/ecma402/#sec-tolocaltime
 * @param t
 * @param calendar
 * @param timeZone
 */
export function ToLocalTime(
  t: number,
  calendar: string,
  timeZone: string,
  {tzData}: {tzData: Record<string, UnpackedZoneData[]>}
): {
  weekday: number;
  era: string;
  year: number;
  relatedYear: undefined;
  yearName: undefined;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  inDST: boolean;
  timeZoneOffset: number;
} {
  invariant(Type(t) === 'Number', 'invalid time');
  invariant(
    calendar === 'gregory',
    'We only support Gregory calendar right now'
  );
  const [timeZoneOffset, inDST] = getApplicableZoneData(t, timeZone, tzData);

  const tz = t + timeZoneOffset;
  const year = YearFromTime(tz);
  return {
    weekday: WeekDay(tz),
    era: year < 0 ? 'BC' : 'AD',
    year,
    relatedYear: undefined,
    yearName: undefined,
    month: MonthFromTime(tz),
    day: DateFromTime(tz),
    hour: HourFromTime(tz),
    minute: MinFromTime(tz),
    second: SecFromTime(tz),
    inDST,
    // IMPORTANT: Not in spec
    timeZoneOffset,
  };
}
