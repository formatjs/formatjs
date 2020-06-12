import * as minimist from 'minimist';
import {readFileSync} from 'fs';
import {outputFileSync} from 'fs-extra';

interface ZoneData {
  offset: number;
}

const MS_PER_SEC = 1e3;
const MS_PER_MIN = MS_PER_SEC * 60;
const MS_PER_HOUR = MS_PER_MIN * 60;

function offsetToMs(offset: string) {
  const [hr, min, sec] = offset.split(':');
  return +hr * MS_PER_HOUR + +min * MS_PER_MIN + (+sec || 0) * MS_PER_SEC;
}

function main(args: minimist.ParsedArgs) {
  const {input, output} = args;
  const data = readFileSync(input, 'utf8').split('\n');
  const result: Record<string, ZoneData> = {};
  for (let line of data) {
    // Ignore comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    // Ignore inline comments
    line = line.split('#')[0];
    if (line.startsWith('Zone')) {
      const [, zone, offset, rule, format, until] = line.split(/[\s\t]+/);
    }
  }

  outputFileSync(
    output,
    `// @generated
// prettier-ignore
export default ${JSON.stringify(data)}`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
