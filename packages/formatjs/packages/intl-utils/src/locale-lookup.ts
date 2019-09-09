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

export function resolveSupportedLocales<
  T extends {locale: string} = {locale: string}
>(locales: string | Array<string | undefined>, localeData: Record<string, T>) {
  let resolvedLocales: string[] = (Array.isArray(locales) ? locales : [locales])
    .filter<string>((s): s is string => typeof s === 'string')
    .map(l => aliases[l as 'zh-CN'] || l);

  const supportedLocales: string[] = [];

  // Using the set of locales + the default locale, we look for the first one
  // which that has been registered. When data does not exist for a locale, we
  // traverse its ancestors to find something that's been registered within
  // its hierarchy of locales.
  resolvedLocales.forEach(locale => {
    if (locale in localeData) {
      return supportedLocales.push(locale);
    }
    // Check if it has an ancestor
    const parentLocale = parentLocales[locale as 'en-150'];
    if (parentLocale in localeData) {
      return supportedLocales.push(parentLocale);
    }

    const localeParts = locale.toLowerCase().split('-');
    while (localeParts.length) {
      if (localeData) {
        const data = localeData[localeParts.join('-')];
        if (data) {
          // Return the normalized locale string; e.g., we return "en-US",
          // instead of "en-us".
          supportedLocales.push(data.locale);
          break;
        }

        localeParts.pop();
      }
    }
  });

  return supportedLocales;
}
