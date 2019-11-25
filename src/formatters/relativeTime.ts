import {IntlConfig, IntlFormatters, Formatters} from '../types';

import {getNamedFormat, filterProps, createError} from '../utils';
import RelativeTimeFormat, {
  IntlRelativeTimeFormatOptions,
} from '@formatjs/intl-relativetimeformat';

const RELATIVE_TIME_FORMAT_OPTIONS: Array<keyof IntlRelativeTimeFormatOptions> = [
  'numeric',
  'style',
];

function getFormatter(
  {
    locale,
    formats,
    onError,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  options: Parameters<IntlFormatters['formatRelativeTime']>[2] = {}
): RelativeTimeFormat {
  const {format} = options;

  const defaults =
    (!!format && getNamedFormat(formats, 'relative', format, onError)) || {};
  const filteredOptions = filterProps(
    options,
    RELATIVE_TIME_FORMAT_OPTIONS,
    defaults as IntlRelativeTimeFormatOptions
  );

  return getRelativeTimeFormat(locale, filteredOptions);
}

export function formatRelativeTime(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  value: Parameters<IntlFormatters['formatRelativeTime']>[0],
  unit?: Parameters<IntlFormatters['formatRelativeTime']>[1],
  options: Parameters<IntlFormatters['formatRelativeTime']>[2] = {}
): string {
  if (!unit) {
    unit = 'second';
  }
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat;
  if (!RelativeTimeFormat) {
    config.onError(
      createError(`Intl.RelativeTimeFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-relativetimeformat"
`)
    );
  }
  try {
    return getFormatter(config, getRelativeTimeFormat, options).format(
      value,
      unit
    );
  } catch (e) {
    config.onError(createError('Error formatting relative time.', e));
  }

  return String(value);
}
