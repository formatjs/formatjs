
import {resolve, dirname} from 'path'
import {sync as globSync} from 'glob'
import {outputFileSync} from 'fs-extra'

const dateFields: Record<string, string> = globSync('*/dateFields.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    )
  })
  .reduce(function(hash: Record<string, string>, filename) {
    hash[dirname(filename)] = `cldr-dates-full/main/${filename}`;
    return hash;
  }, {});

  const locales = Object.keys(dateFields)

  outputFileSync('src/dateFields.ts', `
  ${locales.map((l, i) => `import * as _${i} from '${dateFields[l]}'`).join('\n')}
  export const dateFields = {
      ${locales.map((l, i) => `'${l}': _${i}`)}
  }
`)
