/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

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
    .map(k => ({[k]: obj[k]}));
}

export type CacheValue =
  | Intl.NumberFormat
  | Intl.DateTimeFormat
  | Intl.PluralRules
  | any;

export interface MemoizeFormatConstructorFn {
  <T extends {new (...args: any[]): any}>(
    constructor: T,
    cache?: Record<string, CacheValue>
  ): (...args: ConstructorParameters<T>) => any;
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
