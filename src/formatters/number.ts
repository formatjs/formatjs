import {IntlConfig, Formatters, IntlFormatters} from '../types';
import {getNamedFormat, filterProps, createError} from '../utils';

const NUMBER_FORMAT_OPTIONS: Array<keyof Intl.NumberFormatOptions> = [
  'localeMatcher',

  'style',
  'currency',
  'currencyDisplay',
  'useGrouping',

  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
];

function getFormatter(
  {
    locale,
    formats,
    onError,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getNumberFormat: Formatters['getNumberFormat'],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
) {
  const {format} = options;
  let defaults =
    (format && getNamedFormat(formats!, 'number', format, onError)) || {};
  const filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults);

  return getNumberFormat(locale, filteredOptions);
}

export function formatNumberFactory(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getNumberFormat: Formatters['getNumberFormat']
) {
  return (
    value: Parameters<IntlFormatters['formatNumber']>[0],
    options: Parameters<IntlFormatters['formatNumber']>[1] = {}
  ) => {
    try {
      return getFormatter(config, getNumberFormat, options).format(value);
    } catch (e) {
      config.onError(createError('Error formatting number.', e));
    }

    return String(value);
  };
}
