import tar from 'tar';
import fetch from 'node-fetch';
import minimist from 'minimist';
async function main({version, outDir}: minimist.ParsedArgs) {
  const res = await fetch(
    `https://data.iana.org/time-zones/releases/tzdata${version}.tar.gz`
  );
  res.body.pipe(
    tar.x({
      C: outDir,
    })
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
