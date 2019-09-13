export type Field =
  | 'second'
  | 'second-short'
  | 'second-narrow'
  | 'minute'
  | 'minute-short'
  | 'minute-narrow'
  | 'hour'
  | 'hour-short'
  | 'hour-narrow'
  | 'day'
  | 'day-short'
  | 'day-narrow'
  | 'week'
  | 'week-short'
  | 'week-narrow'
  | 'month'
  | 'month-short'
  | 'month-narrow'
  | 'quarter'
  | 'quarter-short'
  | 'quarter-narrow'
  | 'year'
  | 'year-short'
  | 'year-narrow';

export type Unit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

export type Units =
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'quarters'
  | 'years';

export type FormattableUnit = Unit | Units;
export const VALID_UNITS = [
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'quarters',
  'years',
];
export type RelativeTimeOpt = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface LocaleData {
  locale: string;
  fields?: LocaleFieldsData;
}

export type LocaleFieldsData = {[f in Field]?: FieldData};

export type RelativeTimeData = {[u in RelativeTimeOpt]?: string};
export interface FieldData {
  displayName: string;
  relative: {
    '0'?: string;
    '1'?: string;
    '-1'?: string;
    '2'?: string;
    '-2'?: string;
    '3'?: string;
    '-3'?: string;
  };
  relativeTime: {
    future: RelativeTimeData;
    past: RelativeTimeData;
  };
}
