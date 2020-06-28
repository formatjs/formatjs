import * as minimist from 'minimist';
import {outputJSONSync} from 'fs-extra';
import {extractNumberingSystemNames} from './extract-numbers';
function main(args: minimist.ParsedArgs) {
  const {out} = args;

  // Output numbering systems file
  outputJSONSync(out, extractNumberingSystemNames());
}

if (require.main === module) {
  main(minimist(process.argv));
}
