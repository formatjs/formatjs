/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

// -----------------------------------------------------------------------------

// TODO: Remove this once Intl.RelativeTimeFormat is no longer a draft
interface RelativeTimeFormat {
  format(value: number, unit: string): string;
  formatToParts(value: number, unit: string): { value: string }[];
  resolvedOptions(): ResolvedRelativeTimeFormatOptions;
}
interface ResolvedRelativeTimeFormatOptions
  extends Pick<RelativeTimeFormatOptions, 'numeric' | 'style'> {
  locale: string;
}
interface RelativeTimeFormatOptions {
  localeMatcher: 'best fit' | 'lookup';
  numeric: 'always' | 'auto';
  style: 'long' | 'short' | 'narrow';
}
let RelativeTimeFormat: {
  new (
    locales?: string | string[],
    opts?: RelativeTimeFormatOptions
  ): RelativeTimeFormat;
  (
    locales?: string | string[],
    opts?: RelativeTimeFormatOptions
  ): RelativeTimeFormat;
  supportedLocalesOf(
    locales: string | string[],
    opts?: Pick<RelativeTimeFormatOptions, 'localeMatcher'>
  ): string[];
};

// -- Utilities ----------------------------------------------------------------

function getCacheId(inputs: any[]) {
  return JSON.stringify(
    inputs.map(input =>
      input && typeof input === 'object' ? orderedProps(input) : input
    )
  );
}

function orderedProps(obj: Record<string, any>) {
  return Object.keys(obj)
    .sort()
    .map(k => ({ [k]: obj[k] }));
}

interface MemoizeFormatConstructorFn {
  (constructor: typeof Intl.NumberFormat): (
    ...args: ConstructorParameters<typeof Intl.NumberFormat>
  ) => Intl.NumberFormat;
  (constructor: typeof Intl.DateTimeFormat): (
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ) => Intl.DateTimeFormat;
  (constructor: typeof RelativeTimeFormat): (
    ...args: ConstructorParameters<typeof RelativeTimeFormat>
  ) => RelativeTimeFormat;
  (constructor: any): (...args: any[]) => any;
}

const memoizeFormatConstructor: MemoizeFormatConstructorFn = (
  FormatConstructor: any,
  cache: Record<string, any> = {}
) => (...args: any[]) => {
  const cacheId = getCacheId(args);
  let format = cacheId && cache[cacheId];
  if (!format) {
    format = new (FormatConstructor as any)(...args);
    if (cacheId) {
      cache[cacheId] = format;
    }
  }

  return format;
};

export default memoizeFormatConstructor;
