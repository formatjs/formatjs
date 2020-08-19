import {execFile as _execFile} from 'child_process';
import {promisify} from 'util';
import {resolve} from 'path';
import minimist from 'minimist';
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
  try {
    execFile('/usr/sbin/zic', [
      '-d',
      outDir,
      ...ZONE_FILENAMES.map(fn => resolve(dataDir, fn)),
    ]);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main(minimist(process.argv));
}
