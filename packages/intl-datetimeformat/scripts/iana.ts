import * as tar from 'tar';
import fetch from 'node-fetch';
import {join} from 'path';
async function main() {
  const res = await fetch(
    'https://data.iana.org/time-zones/releases/tzdata2020a.tar.gz'
  );
  res.body.pipe(
    tar.x({
      C: join(__dirname, '../iana-data'),
    })
  );
}

if (require.main === module) {
  main();
}
