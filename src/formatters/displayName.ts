import {IntlConfig, Formatters, IntlFormatters} from '../types';
import {filterProps, createError} from '../utils';
import {
  DisplayNamesOptions,
  DisplayNames as IntlDisplayNames,
} from '@formatjs/intl-displaynames';

const DISPLAY_NAMES_OPTONS: Array<keyof DisplayNamesOptions> = [
  'localeMatcher',
  'style',
  'type',
  'fallback',
];

export function formatDisplayName(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getDisplayNames: Formatters['getDisplayNames'],
  value: Parameters<IntlFormatters['formatDisplayName']>[0],
  options: Parameters<IntlFormatters['formatDisplayName']>[1] = {}
): string | undefined {
  const DisplayNames: typeof IntlDisplayNames = (Intl as any).DisplayNames;
  if (!DisplayNames) {
    onError(
      createError(`Intl.DisplayNames is not available in this environment.
Try polyfilling it using "@formatjs/intl-displaynames"
`)
    );
  }
  const filteredOptions = filterProps(options, DISPLAY_NAMES_OPTONS);
  try {
    return getDisplayNames(locale, filteredOptions).of(value);
  } catch (e) {
    onError(createError('Error formatting display name.', e));
  }
}
