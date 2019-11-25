import {IntlConfig, Formatters, IntlFormatters} from '../types';
import {filterProps, createError} from '../utils';

const PLURAL_FORMAT_OPTIONS: Array<keyof Intl.PluralRulesOptions> = [
  'localeMatcher',
  'type',
];

export function formatPlural(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getPluralRules: Formatters['getPluralRules'],
  value: Parameters<IntlFormatters['formatPlural']>[0],
  options: Parameters<IntlFormatters['formatPlural']>[1] = {}
): string {
  if (!Intl.PluralRules) {
    onError(
      createError(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`)
    );
  }
  const filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);

  try {
    return getPluralRules(locale, filteredOptions).select(value);
  } catch (e) {
    onError(createError('Error formatting plural.', e));
  }

  return 'other';
}
