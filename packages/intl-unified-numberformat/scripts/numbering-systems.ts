import * as minimist from 'minimist';
import {outputFileSync} from 'fs-extra';
import {extractNumberingSystemNames} from 'formatjs-extract-cldr-data';

function main(args: minimist.ParsedArgs) {
  // Output numbering systems file
  outputFileSync(
    args.out,
    `export default ${JSON.stringify(extractNumberingSystemNames().names)}`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
