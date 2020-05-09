import * as minimist from 'minimist';
import {outputFileSync} from 'fs-extra';

import {SANCTIONED_UNITS, removeUnitNamespace} from '@formatjs/intl-utils';

function main(args: minimist.ParsedArgs) {
  outputFileSync(
    args.out,
    `/* @generated */
  export type Unit =
    ${SANCTIONED_UNITS.map(unit => `'${removeUnitNamespace(unit)}'`).join(
      ' | '
    )}
  `
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
