export type LDMLPluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
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

type RelativeTimeData = {[u in LDMLPluralRule]?: string};

type LocaleFieldsData = {[f in Field]?: FieldData};

type Field =
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

export interface RelativeTimeLocaleData {
  locale: string;
  fields: LocaleFieldsData;
}
