import * as React from 'react';
import {IntlConfig, Formatters, IntlFormatters} from '../types';
import {filterProps, createError} from '../utils';
import IntlListFormat, {IntlListFormatOptions} from '@formatjs/intl-listformat';

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
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getListFormat: Formatters['getListFormat'],
  values: Array<string>,
  options: Parameters<IntlFormatters['formatList']>[1]
): string;
export function formatList(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getListFormat: Formatters['getListFormat'],
  values: Parameters<IntlFormatters['formatList']>[0],
  options: Parameters<IntlFormatters['formatList']>[1] = {}
): React.ReactNode {
  const ListFormat: typeof IntlListFormat = (Intl as any).ListFormat;
  if (!ListFormat) {
    onError(
      createError(`Intl.ListFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-listformat"
`)
    );
  }
  const filteredOptions = filterProps(options, LIST_FORMAT_OPTIONS);

  try {
    const richValues: Record<string, React.ReactNode> = {};
    const serializedValues = values.map((v, i) => {
      if (typeof v === 'object') {
        const id = generateToken(i);
        richValues[id] = v;
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
    return parts.reduce((all: Array<string | React.ReactNode>, el) => {
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
    onError(createError('Error formatting list.', e));
  }

  return values;
}
