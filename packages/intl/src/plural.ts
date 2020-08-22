import {Formatters, IntlFormatters, OnErrorFn} from './types';
import {filterProps} from './utils';
import {MessageFormatError} from './error';
import {ErrorCode, FormatError} from 'intl-messageformat';
import {LDMLPluralRule} from '@formatjs/ecma402-abstract';

const PLURAL_FORMAT_OPTIONS: Array<keyof Intl.PluralRulesOptions> = [
  'localeMatcher',
  'type',
];

export function formatPlural(
  {
    locale,
    onError,
  }: {
    locale: string;
    onError: OnErrorFn;
  },
  getPluralRules: Formatters['getPluralRules'],
  value: Parameters<IntlFormatters['formatPlural']>[0],
  options: Parameters<IntlFormatters['formatPlural']>[1] = {}
): LDMLPluralRule {
  if (!Intl.PluralRules) {
    onError(
      new FormatError(
        `Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,
        ErrorCode.MISSING_INTL_API
      )
    );
  }
  const filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);

  try {
    return getPluralRules(locale, filteredOptions).select(
      value
    ) as LDMLPluralRule;
  } catch (e) {
    onError(new MessageFormatError('Error formatting plural.', e));
  }

  return 'other';
}
