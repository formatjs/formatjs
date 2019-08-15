import {Locale} from './types';
import {getParentLocale, normalizeLocale} from './locales';

export default function generateFieldExtractorFn<
  DataType extends Record<string, any>
>(
  loadFieldsFn: (locale: string, field?: string) => DataType,
  checkCachedFieldsFn: (locale: string) => boolean
) {
  return (
    locales: Locale[],
    field?: string
  ): Record<Locale, {fields: DataType}> => {
    // The CLDR states that the "root" locale's data should be used to fill in
    // any missing data as its data is the default.
    const defaultFields = loadFieldsFn('root', field);

    const fields: Record<Locale, DataType> = {};
    const hashes: Record<Locale, string> = {};

    // Loads and caches the relative fields for a given `locale` because loading
    // and transforming the data is expensive.
    function getFields(locale: Locale) {
      let cachedFields = fields[locale];
      if (cachedFields) {
        return cachedFields;
      }

      if (checkCachedFieldsFn(locale)) {
        cachedFields = fields[locale] = loadFieldsFn(locale, field);
        return cachedFields;
      }
    }

    // Hashes and caches the `fields` for a given `locale` to avoid hashing more
    // than once since it could be expensive.
    function hashFields(locale: Locale, fields: any): string {
      let hash = hashes[locale];
      if (hash) {
        return hash;
      }

      hash = hashes[locale] = JSON.stringify(fields);
      return hash;
    }

    // We want to de-dup data that can be referenced from upstream in the
    // `locale`'s hierarchy when that locale's relative fields are the _exact_
    // same as one of its ancestors. This will traverse the hierarchy for the
    // given `locale` until it finds an ancestor with same same relative fields.
    // When an ancestor can't be found, a data entry must be created for the
    // `locale` since its relative fields are unique.
    function findGreatestAncestor(locale: Locale): Locale {
      // The "root" locale is not a suitable ancestor, because there won't be
      // an entry for "root" in the final data object.
      var parentLocale = getParentLocale(locale);
      if (!parentLocale || parentLocale === 'root') {
        return locale;
      }

      // When the `locale` doesn't have fields data, we need to traverse up
      // its hierarchy to find suitable relative fields data.
      if (!checkCachedFieldsFn(locale)) {
        return findGreatestAncestor(parentLocale);
      }

      var fields;
      var parentFields;
      if (checkCachedFieldsFn(parentLocale)) {
        fields = getFields(locale);
        parentFields = getFields(parentLocale);

        // We can only use this ancestor's fields if they hash to the
        // _exact_ same value as `locale`'s fields. If the ancestor is
        // suitable, we keep looking up its hierarchy until the relative
        // fields are determined to be unique.
        if (
          hashFields(locale, fields) === hashFields(parentLocale, parentFields)
        ) {
          return findGreatestAncestor(parentLocale);
        }
      }

      return locale;
    }

    return locales.reduce(
      (fields: Record<Locale, {fields: DataType}>, locale) => {
        // Walk the `locale`'s hierarchy to look for suitable ancestor with the
        // _exact_ same relative fields. If no ancestor is found, the given
        // `locale` will be returned.
        locale = findGreatestAncestor(normalizeLocale(locale));

        // The "root" locale is ignored because the built-in `Intl` libraries in
        // JavaScript have no notion of a "root" locale; instead they use the
        // IANA Language Subtag Registry.
        if (locale === 'root') {
          return fields;
        }

        // Add an entry for the `locale`, which might be an ancestor. If the
        // locale doesn't have relative fields, then we fallback to the "root"
        // locale's fields.
        fields[locale] = {
          fields: getFields(locale) || defaultFields,
        };

        return fields;
      },
      {}
    );
  };
}
