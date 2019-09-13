import {resolve} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import * as aliases from 'cldr-core/supplemental/aliases.json';
import * as PARENT_LOCALES from 'cldr-core/supplemental/parentLocales.json';

const {languageAlias} = aliases.supplemental.metadata.alias;

/**
 * Turn aliases into Record<string, string> using _replacement
 */
const localeAliases = Object.keys(languageAlias).reduce(
  (all: Record<string, string>, locale) => {
    all[locale] = languageAlias[locale as 'zh-CN']._replacement;
    return all;
  },
  {}
);

const parentLocales = PARENT_LOCALES.supplemental.parentLocales.parentLocale;
const parentLocaleMap = Object.keys(parentLocales).reduce(
  (all: Record<string, string>, locale: string) => {
    if (parentLocales[locale as 'en-150'] !== 'root') {
      all[locale] = parentLocales[locale as 'en-150'];
    }
    return all;
  },
  {}
);

outputFileSync(
  resolve(__dirname, '../src/aliases.ts'),
  `/* @generated */	
// prettier-ignore  
export default ${serialize(localeAliases)}
`
);

outputFileSync(
  resolve(__dirname, '../src/parentLocales.ts'),
  `/* @generated */	
// prettier-ignore  
export default ${serialize(parentLocaleMap)}
`
);
