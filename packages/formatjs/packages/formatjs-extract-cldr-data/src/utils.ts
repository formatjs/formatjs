import {Locale} from './types';
import {getParentLocaleHierarchy} from '@formatjs/intl-utils';
import {omitBy, isEmpty, assign} from 'lodash';

function dedupeUsingParentHierarchy<DataType extends Record<string, any>>(
  ...data: DataType[]
): DataType[] {
  const results: DataType[] = [data.pop()!];
  while (data.length) {
    const datum = data.pop();
    const accumulatedParentData = assign({}, ...results);
    results.unshift(omitBy<DataType>(
      datum,
      (d, field) =>
        JSON.stringify(accumulatedParentData[field]) === JSON.stringify(d)
    ) as any);
  }
  return results;
}

export default function generateFieldExtractorFn<
  DataType extends Record<string, any>
>(
  loadFieldsFn: (locale: Locale) => DataType,
  checkCachedFieldsFn: (locale: string) => boolean,
  availableLocales: string[]
) {
  return (locales: Locale[]) => {
    const fieldCache: Record<Locale, DataType> = {};

    // Loads and caches the relative fields for a given `locale` because loading
    // and transforming the data is expensive.
    function getFields(locale: Locale) {
      let cachedFields = fieldCache[locale];
      if (cachedFields) {
        return cachedFields;
      }

      if (checkCachedFieldsFn(locale)) {
        const localesIncludingParents = [
          locale,
          ...getParentLocaleHierarchy(locale),
        ].filter(l => availableLocales.includes(l));
        dedupeUsingParentHierarchy(
          ...localesIncludingParents.map(loadFieldsFn)
        ).forEach((datum, i) => {
          cachedFields = fieldCache[localesIncludingParents[i]] = datum;
        });
        return cachedFields;
      }
    }

    locales.forEach(getFields);

    return omitBy(fieldCache, isEmpty);
  };
}
