export interface ListPatternLocaleData {
  locale: string;
  fields: {
    standard?: ListPatternData;
    or?: ListPatternData;
    unit?: ListPatternData;
  };
}
export interface ListPattern {
  start: string;
  middle: string;
  end: string;
  '2': string;
}

export interface ListPatternData {
  long: ListPattern;
  short?: ListPattern;
  narrow?: ListPattern;
}
