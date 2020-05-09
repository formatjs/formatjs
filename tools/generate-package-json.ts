import {outputJSONSync, readJSONSync} from 'fs-extra';
import * as minimist from 'minimist';

function main(args: Record<string, string>) {
  const json = readJSONSync(args.template);
  json.name = args.name;
  json.description = args.description;
  json.license = args.license;
  outputJSONSync(args.out, json, {
    spaces: 2,
  });
}

if (require.main === module) {
  main(minimist(process.argv));
}
