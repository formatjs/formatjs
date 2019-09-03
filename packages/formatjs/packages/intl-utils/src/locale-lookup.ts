import aliases from './aliases';
export function resolveSupportedLocales<
  T extends {locale: string} = {locale: string}
>(locales: string | Array<string | undefined>, localeData: Record<string, T>) {
  let resolvedLocales: string[] = (Array.isArray(locales) ? locales : [locales])
    .filter<string>((s): s is string => typeof s === 'string')
    .map(l => aliases[l as 'zh-CN'] || l);

  let i, len, localeParts, data;

  const supportedLocales = [];

  // Using the set of locales + the default locale, we look for the first one
  // which that has been registered. When data does not exist for a locale, we
  // traverse its ancestors to find something that's been registered within
  // its hierarchy of locales. Since we lack the proper `parentLocale` data
  // here, we must take a naive approach to traversal.
  for (i = 0, len = resolvedLocales.length; i < len; i += 1) {
    localeParts = resolvedLocales[i].toLowerCase().split('-');

    while (localeParts.length) {
      if (localeData) {
        data = localeData[localeParts.join('-')];
        if (data) {
          // Return the normalized locale string; e.g., we return "en-US",
          // instead of "en-us".
          supportedLocales.push(data.locale);
          break;
        }

        localeParts.pop();
      }
    }
  }

  return supportedLocales;
}
