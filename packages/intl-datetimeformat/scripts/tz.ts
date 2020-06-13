import * as minimist from 'minimist';
import {outputFileSync} from 'fs-extra';
import {execFile as _execFile} from 'child_process';
import zones from '../src/zones';
import {promisify} from 'util';

const execFile = promisify(_execFile);
type ZoneData = [
  // From in UTC Time
  number,
  // Abbreviation like EST/EDT
  string,
  // Offset in seconds
  number,
  // Whether it's daylight, 0|1
  number
];
const SPACE_REGEX = /[\s\t]+/;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function monthToNum(m: string) {
  const month = MONTHS.indexOf(m) + 1;
  if (month < 10) {
    return `0${month}`;
  }
  return month;
}

function utTimeToMs(utTime: string) {
  const [, month, date, hourMinSec, year] = utTime.split(SPACE_REGEX);
  const [hour, min, sec] = hourMinSec.split(':');
  return new Date(
    `${year}-${monthToNum(month)}-${date}T${hour}:${min}:${sec}Z`
  ).getTime();
}

const LINE_REGEX = /^(.*?)\s+(.*?) UT = (.*?) isdst=(0|1) gmtoff=(.*?)$/i;

async function main(args: minimist.ParsedArgs) {
  const {output} = args;
  const data: Record<string, ZoneData[]> = {};
  await execFile('zdump', ['-v', ...zones], {
    maxBuffer: 100 * 1024 * 1024,
  }).then(({stdout, stderr}) => {
    if (stderr) {
      throw new Error(stderr);
    }
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.endsWith('NULL')) {
        continue;
      }
      const chunks = LINE_REGEX.exec(line);
      if (!chunks) {
        continue;
      }
      const [, zone, utTime, localTime, dst, offsetStr] = chunks;
      const offsetInSeconds = +offsetStr;
      const abbrv = localTime.split(SPACE_REGEX).pop()!;

      if (!data[zone]) {
        data[zone] = [[-Infinity, abbrv, offsetInSeconds, +dst]];
      } else {
        const lastEntry = data[zone][data[zone].length - 1];
        if (lastEntry[1] !== abbrv) {
          data[zone].push([utTimeToMs(utTime), abbrv, offsetInSeconds, +dst]);
        }
      }
    }
  });

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
