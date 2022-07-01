export type Collation = typeof collations[number]

export const collations = [
  'big5han',
  'compat',
  'dict',
  'direct', // deprecated
  'ducet', // not available on web
  'emoji',
  'eor',
  'gb2312', // not available on Chrome or Edge anymore
  'phonebk',
  'phonetic',
  'pinyin',
  'reformed', // default for Swedish as of May 2022
  'search', // do not use
  'searchjl',
  'standard', // do not use explicitly
  'stroke',
  'trad',
  'unihan', // Not available on chrome or edge
  'zhuyin',
] as const
