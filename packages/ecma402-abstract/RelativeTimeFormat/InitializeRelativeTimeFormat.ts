import {
  RelativeTimeFormat,
  IntlRelativeTimeFormatOptions,
  RelativeTimeFormatInternal,
  LocaleFieldsData,
} from '../types/relative-time';
import {CanonicalizeLocaleList} from '../CanonicalizeLocaleList';
import {ToObject} from '../262';
import {GetOption} from '../GetOption';
import {ResolveLocale} from '../ResolveLocale';
import {invariant} from '../utils';

const NUMBERING_SYSTEM_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i;

export function InitializeRelativeTimeFormat(
  rtf: RelativeTimeFormat,
  locales: string | string[] | undefined,
  options: IntlRelativeTimeFormatOptions | undefined,
  {
    getInternalSlots,
    availableLocales,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale,
  }: {
    getInternalSlots(rtf: RelativeTimeFormat): RelativeTimeFormatInternal;
    availableLocales: string[];
    relevantExtensionKeys: string[];
    localeData: Record<string, LocaleFieldsData | undefined>;
    getDefaultLocale(): string;
  }
) {
  const internalSlots = getInternalSlots(rtf);
  internalSlots.initializedRelativeTimeFormat = true;
  const requestedLocales = CanonicalizeLocaleList(locales);
  const opt: any = Object.create(null);
  const opts = options === undefined ? Object.create(null) : ToObject(options);
  const matcher = GetOption(
    opts,
    'localeMatcher',
    'string',
    ['best fit', 'lookup'],
    'best fit'
  );
  opt.localeMatcher = matcher;
  const numberingSystem: string = GetOption(
    opts,
    'numberingSystem',
    'string',
    undefined,
    undefined
  );
  if (numberingSystem !== undefined) {
    if (!NUMBERING_SYSTEM_REGEX.test(numberingSystem)) {
      throw new RangeError(`Invalid numbering system ${numberingSystem}`);
    }
  }
  opt.nu = numberingSystem;
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  );
  const {locale, nu} = r;
  internalSlots.locale = locale;
  internalSlots.style = GetOption(
    opts,
    'style',
    'string',
    ['long', 'narrow', 'short'],
    'long'
  );
  internalSlots.numeric = GetOption(
    opts,
    'numeric',
    'string',
    ['always', 'auto'],
    'always'
  );
  const fields = localeData[locale];
  invariant(!!fields, `Missing locale data for ${locale}`);
  internalSlots.fields = fields;
  internalSlots.numberFormat = new Intl.NumberFormat(locales);
  internalSlots.pluralRules = new Intl.PluralRules(locales);
  internalSlots.numberingSystem = nu;
  return rtf;
}
