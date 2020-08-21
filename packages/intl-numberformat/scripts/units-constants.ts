import minimist from 'minimist';
import {SIMPLE_UNITS} from '@formatjs/ecma402-abstract';
import {outputFileSync} from 'fs-extra';

function main(args: minimist.ParsedArgs) {
  const {out} = args;

  outputFileSync(
    out,
    `/* @generated */
  // prettier-ignore
  export type Unit =
    ${SIMPLE_UNITS.map(u => `'${u}'`).join(' | ')}
  `
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
