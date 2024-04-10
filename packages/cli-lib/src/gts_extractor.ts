import {parseFile as parseHbsFile} from './hbs_extractor'
import {parseScript} from './parse_script'
// We can't use an import here because the gts_extractor.ts file
// is FAKE TS -- in that it's actually CJS.
//
// So we have to use require because content-tag is a real type=module package
// and we need TypeScript to recognize that it has to choose the node/require
// condition of package.json#exports
// https://github.com/embroider-build/content-tag/blob/main/package.json#L18
let {Preprocessor} = require('content-tag')
let p = new Preprocessor()

export function parseFile(source: string, fileName: string, options: any) {
  const scriptParseFn = parseScript(options, fileName)
  const transformedSource = p.process(source, {filename: fileName})

  scriptParseFn(transformedSource)

  // extract template from transformed source to then run through hbs processor
  const parseResult = p.parse(source, {filename: fileName})

  for (let parsed of parseResult) {
    parseHbsFile(parsed.contents, fileName, options)
  }
}
