import {processAliases} from 'formatjs-extract-cldr-data';
import {resolve} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
// Extract aliases
const aliases = processAliases();
outputFileSync(
  resolve(__dirname, '../src/aliases.ts'),
  `/* @generated */	
// prettier-ignore  
export default ${serialize(aliases)}
`
);
