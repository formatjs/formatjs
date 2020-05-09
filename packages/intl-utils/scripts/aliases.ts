import {outputFileSync, readJSONSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import * as minimist from 'minimist';

const aliases = readJSONSync(
  require.resolve('cldr-core/supplemental/aliases.json')
);

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

function main(args: Record<string, string>) {
  outputFileSync(
    args.out,
    `/* @generated */	
// prettier-ignore  
export default ${serialize(localeAliases)}
  `
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
