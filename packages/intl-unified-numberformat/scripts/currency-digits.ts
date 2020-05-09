import * as minimist from 'minimist';
import {outputFileSync} from 'fs-extra';
import {extractCurrencyDigits} from 'formatjs-extract-cldr-data';

function main(args: minimist.ParsedArgs) {
  // Output currency digits file
  outputFileSync(
    args.out,
    `export default ${JSON.stringify(extractCurrencyDigits())}`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
