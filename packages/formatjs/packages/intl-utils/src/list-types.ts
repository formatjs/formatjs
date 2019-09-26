export interface ListPatternLocaleData {
  locale: string;
  patterns: {
    standard: ListPatternData;
    or: ListPatternData;
    unit: ListPatternData;
  };
}
interface ListPattern {
  start?: string;
  middle?: string;
  end?: string;
  '2'?: string;
}

export interface ListPatternData {
  long: ListPattern;
  short?: ListPattern;
  narrow?: ListPattern;
}
