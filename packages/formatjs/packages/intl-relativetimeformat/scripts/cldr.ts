import {
  extractAllRelativeFields,
  getAllDateFieldsLocales,
} from 'formatjs-extract-cldr-data';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {
  RelativeTimeLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '../../intl-utils';

const data = extractAllRelativeFields();
const langData = getAllDateFieldsLocales().reduce(
  (all: Record<string, RelativeTimeLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    if (!all[lang]) {
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
      all[lang] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    } else {
      all[lang].data[locale] = data[locale];
      all[lang].availableLocales.push(locale);
    }

    if (locale === 'en-US-POSIX') {
      all[lang].availableLocales.push('en-US');
    }

    return all;
  },
  {}
);

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */	
// prettier-ignore
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
  );
});

// Dist all json locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.json');
  outputJSONSync(destFile, langData[lang]);
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */	
// prettier-ignore  
import IntlRelativeTimeFormat from "./core";\n
IntlRelativeTimeFormat.__addLocaleData(${Object.keys(langData)
    .map(lang => JSON.stringify(langData[lang]))
    .join(',\n')});	
export default IntlRelativeTimeFormat;	
  `
);
