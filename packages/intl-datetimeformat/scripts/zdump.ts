import * as minimist from 'minimist';

import zones from '../src/zones';
import {execFile as _execFile} from 'child_process';
import {promisify} from 'util';
import {resolve} from 'path';
import {outputFile} from 'fs-extra';

const execFile = promisify(_execFile);
async function main(args: minimist.ParsedArgs) {
  const {output, zicDir} = args;
  // const data: Record<string, ZoneData[]> = {};
  const {stdout, stderr} = await execFile(
    'zdump',
    ['-v', ...zones.map(z => resolve(zicDir, z))],
    {
      maxBuffer: 100 * 1024 * 1024,
    }
  );
  if (stderr) {
    console.error(stderr);
    process.exit(1);
  }
  await outputFile(output, stdout);
}

if (require.main === module) {
  main(minimist(process.argv));
}
