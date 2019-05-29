export const enum FIELD {
  second = 'second',
  secondShort = 'second-short',
  minute = 'minute',
  minuteShort = 'minute-short',
  hour = 'hour',
  hourShort = 'hour-short',
  day = 'day',
  dayShort = 'day-short',
  week = 'week',
  weekShort = 'week-short',
  month = 'month',
  monthShort = 'month-short',
  year = 'year',
  yearShort = 'year-short'
}

export const enum STYLE {
  bestFit = 'best fit',
  numeric = 'numeric'
}

export interface LocaleData {
  locale: string;
  parentLocale?: string;
  fields?: {
    [f in FIELD]: {
      displayName: string;
      relative: Record<string, string>;
      relativePeriod?: string;
      relativeTime: {
        future: Record<string, string>;
        past: Record<string, string>;
      };
    }
  };
}
