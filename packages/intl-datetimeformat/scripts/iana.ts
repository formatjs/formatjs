import * as tar from 'tar';
import fetch from 'node-fetch';
import {join} from 'path';
import * as minimist from 'minimist';
async function main({version}: minimist.ParsedArgs) {
  const res = await fetch(
    `https://data.iana.org/time-zones/releases/tzdata${version}.tar.gz`
  );
  res.body.pipe(
    tar.x({
      C: join(__dirname, '../iana-data'),
    })
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
