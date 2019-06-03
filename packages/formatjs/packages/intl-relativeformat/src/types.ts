export const enum FIELD {
  second = 'second',
  secondShort = 'second-short',
  secondNarrow = 'second-narrow',
  minute = 'minute',
  minuteShort = 'minute-short',
  minuteNarrow = 'minute-narrow',
  hour = 'hour',
  hourShort = 'hour-short',
  hourNarrow = 'hour-narrow',
  day = 'day',
  dayShort = 'day-short',
  dayNarrow = 'day-narrow',
  week = 'week',
  weekShort = 'week-short',
  weekNarrow = 'week-narrow',
  month = 'month',
  monthShort = 'month-short',
  monthNarrow = 'month-narrow',
  year = 'year',
  yearShort = 'year-short',
  yearNarrow = 'year-narrow'
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
