import minimist from 'minimist';
import {extractCurrencyDigits} from './extract-currencies';
import {outputJSONSync} from 'fs-extra';

function main(args: minimist.ParsedArgs) {
  const {out} = args;
  // Output currency digits file
  outputJSONSync(out, extractCurrencyDigits());
}

if (require.main === module) {
  main(minimist(process.argv));
}
