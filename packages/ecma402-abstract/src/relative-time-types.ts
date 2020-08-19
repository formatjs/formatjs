import {LocaleData} from './types';
import {LDMLPluralRule} from './plural-rules-types';

export interface FieldData {
  '0'?: string;
  '1'?: string;
  '-1'?: string;
  '2'?: string;
  '-2'?: string;
  '3'?: string;
  '-3'?: string;
  future: RelativeTimeData;
  past: RelativeTimeData;
}

type RelativeTimeData = {[u in LDMLPluralRule]?: string};

export type UnpackedLocaleFieldsData = {
  [f in RelativeTimeField]?: FieldData;
} & {nu: Array<string | null>};

export type LocaleFieldsData = {
  [f in RelativeTimeField]?: FieldData;
} & {nu?: Array<string | null>};

export type RelativeTimeField =
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

export type RelativeTimeLocaleData = LocaleData<LocaleFieldsData>;
