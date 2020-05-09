import {outputFileSync, readJSONSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import * as minimist from 'minimist';

const PARENT_LOCALES = readJSONSync(
  require.resolve('cldr-core/supplemental/parentLocales.json')
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

function main(args: Record<string, string>) {
  outputFileSync(
    args.out,
    `/* @generated */	
// prettier-ignore  
export default ${serialize(parentLocaleMap)}
  `
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
