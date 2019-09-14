export interface UnifiedNumberFormatLocaleData {
  locale: string;
  units: Record<string, UnitData>;
}
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
