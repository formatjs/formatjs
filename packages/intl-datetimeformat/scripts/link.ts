import * as minimist from 'minimist';
import {readFileSync} from 'fs';
import {outputFileSync} from 'fs-extra';
function main(args: minimist.ParsedArgs) {
  const {input, output} = args;
  const linkMap = readFileSync(input, 'utf8')
    .split('\n')
    // Ignore comments
    .filter(line => line && !line.startsWith('#'))
    .reduce((all: Record<string, string>, line) => {
      const [, target, link] = line.split(/[\s\t]+/);
      all[link] = target;
      return all;
    }, {});
  outputFileSync(
    output,
    `// @generated
// prettier-ignore
export default ${JSON.stringify(linkMap)}`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
