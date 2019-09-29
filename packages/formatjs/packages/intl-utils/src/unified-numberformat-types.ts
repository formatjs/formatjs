import {LocaleData} from './types';

export type UnifiedNumberFormatLocaleData = LocaleData<
  Record<string, UnitData>
>;

interface UnitPattern {
  one?: string;
  other?: string;
}

export interface UnitData {
  displayName: string;
  long: UnitPattern;
  short?: UnitPattern;
  narrow?: UnitPattern;
}
