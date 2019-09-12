import aliases from './aliases';
import parentLocales from './parentLocales';

export function getParentLocaleHierarchy(locale: string): string[] {
  const results = [];
  locale = aliases[locale as 'zh-CN'] || locale;
  const parentLocale = parentLocales[locale as 'en-150'];
  if (parentLocale) {
    results.push(parentLocale);
  }
  const localeParts = locale.split('-');
  for (let i = localeParts.length; i > 1; i--) {
    results.push(localeParts.slice(0, i - 1).join('-'));
  }
  return results;
}

function resolveSupportedLocale<T extends {locale: string} = {locale: string}>(
  locale: string | undefined,
  localeData: Record<string, T>
) {
  if (!locale) {
    return;
  }

  const lowercasedLocale = locale.toLowerCase();
  if (lowercasedLocale in localeData) {
    return localeData[lowercasedLocale].locale || locale;
  }

  let alias = aliases[locale as 'zh-CN'];
  if (alias) {
    const lowercasedAlias = alias.toLowerCase();
    if (lowercasedAlias in localeData) {
      return localeData[lowercasedAlias].locale || alias;
    }
  }

  const parentHierarchy = getParentLocaleHierarchy(locale);
  let parentLocale: string | undefined = locale;
  while (parentLocale) {
    parentLocale = parentHierarchy.shift();
    if (parentLocale) {
      const lowercasedParentLocale = parentLocale.toLowerCase();
      if (lowercasedParentLocale in localeData) {
        return localeData[lowercasedParentLocale].locale || parentLocale;
      }
    }
  }
  return;
}

export function supportedLocalesOf<
  T extends {locale: string} = {locale: string}
>(locales: string | Array<string | undefined>, localeData: Record<string, T>) {
  const localeArray = Array.isArray(locales) ? locales : [locales];
  return localeArray.filter(l => !!resolveSupportedLocale(l, localeData));
}

export function findSupportedLocale<
  T extends {locale: string} = {locale: string}
>(locales: string | Array<string | undefined>, localeData: Record<string, T>) {
  const localeArray = Array.isArray(locales) ? locales : [locales];
  for (let i = 0; i < localeArray.length; i++) {
    const resolvedLocale = resolveSupportedLocale(localeArray[i], localeData);
    if (resolvedLocale) {
      return resolvedLocale;
    }
  }
}
