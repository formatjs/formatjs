import {Formatters, IntlFormatters, OnErrorFn} from './types';
import {filterProps} from './utils';
import type IntlListFormat from '@formatjs/intl-listformat';
import type {IntlListFormatOptions} from '@formatjs/intl-listformat';
import {FormatError, ErrorCode} from 'intl-messageformat';
import {IntlError, IntlErrorCode} from './error';

const LIST_FORMAT_OPTIONS: Array<keyof IntlListFormatOptions> = [
  'localeMatcher',
  'type',
  'style',
];

const now = Date.now();

function generateToken(i: number): string {
  return `${now}_${i}_${now}`;
}

export function formatList(
  {
    locale,
    onError,
  }: {
    locale: string;
    onError: OnErrorFn;
  },
  getListFormat: Formatters['getListFormat'],
  values: Array<string>,
  options: Parameters<IntlFormatters['formatList']>[1]
): string;
export function formatList<T>(
  {
    locale,
    onError,
  }: {
    locale: string;
    onError: OnErrorFn;
  },
  getListFormat: Formatters['getListFormat'],
  values: Parameters<IntlFormatters['formatList']>[0],
  options: Parameters<IntlFormatters['formatList']>[1] = {}
): Array<T | string> | string {
  const ListFormat: typeof IntlListFormat = (Intl as any).ListFormat;
  if (!ListFormat) {
    onError(
      new FormatError(
        `Intl.ListFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-listformat"
`,
        ErrorCode.MISSING_INTL_API
      )
    );
  }
  const filteredOptions = filterProps(options, LIST_FORMAT_OPTIONS);

  try {
    const richValues: Record<string, T> = {};
    const serializedValues = values.map((v, i) => {
      if (typeof v === 'object') {
        const id = generateToken(i);
        richValues[id] = v as any;
        return id;
      }
      return String(v);
    });
    if (!Object.keys(richValues).length) {
      return getListFormat(locale, filteredOptions).format(serializedValues);
    }
    const parts = getListFormat(locale, filteredOptions).formatToParts(
      serializedValues
    );
    return parts.reduce((all: Array<string | T>, el) => {
      const val = el.value;
      if (richValues[val]) {
        all.push(richValues[val]);
      } else if (typeof all[all.length - 1] === 'string') {
        all[all.length - 1] += val;
      } else {
        all.push(val);
      }
      return all;
    }, []);
  } catch (e) {
    onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting list.', e)
    );
  }

  // @ts-ignore
  return values;
}
