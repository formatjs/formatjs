import {Locale} from './types';
import {
  getLocaleHierarchy,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';
import {pickBy, isEmpty, isEqual} from 'lodash';

function dedupeUsingParentHierarchy<DataType extends Record<string, any>>(
  ...data: DataType[]
): DataType[] {
  const results: DataType[] = [data.pop()!];
  while (data.length) {
    const datum = data.pop();
    const accumulatedParentData: DataType = Object.assign({}, ...results);
    results.push(pickBy<DataType>(
      datum,
      (d, field) => !isEqual(accumulatedParentData[field], d)
    ) as any);
  }
  results.reverse();
  return results;
}

export default function generateFieldExtractorFn<
  DataType extends Record<string, any>
>(
  loadFieldsFn: (locale: Locale) => DataType,
  hasDataForLocale: (locale: string) => boolean,
  availableLocales: string[]
) {
  return (locales: Locale[]) => {
    const fieldCache: Record<Locale, DataType> = {};

    // Loads and caches the relative fields for a given `locale` because loading
    // and transforming the data is expensive.
    function populateFields(locale: Locale) {
      if (locale in fieldCache || !hasDataForLocale(locale)) {
        return;
      }

      const lang = locale.split('-')[0];

      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);

      const localesIncludingParents = getLocaleHierarchy(
        locale,
        aliases,
        parentLocales
      ).filter(l => availableLocales.includes(l));

      dedupeUsingParentHierarchy(
        ...localesIncludingParents.map(loadFieldsFn)
      ).forEach((datum, i) => {
        fieldCache[localesIncludingParents[i]] = datum;
      });
    }

    locales.forEach(populateFields);
    return pickBy(fieldCache, o => !isEmpty(o));
  };
}
