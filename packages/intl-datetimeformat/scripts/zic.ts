import {execFile as _execFile} from 'child_process';
import {promisify} from 'util';
import {resolve} from 'path';
import * as minimist from 'minimist';
const execFile = promisify(_execFile);

const ZONE_FILENAMES = [
  'africa',
  'antarctica',
  'asia',
  'australasia',
  'etcetera',
  'europe',
  'northamerica',
  'southamerica',
  'pacificnew',
  'backward',
];

async function main(args: minimist.ParsedArgs) {
  const {dataDir, outDir} = args;
  await Promise.all(
    ZONE_FILENAMES.map(fn =>
      execFile('zic', ['-d', outDir, resolve(dataDir, fn)])
    )
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
