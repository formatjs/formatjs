import {Preprocessor} from 'content-tag'
import {parseFile as parseHbsFile} from '#packages/cli-lib/hbs_extractor.js'
import {type ScriptParseFn} from '#packages/cli-lib/svelte_extractor.js'
let p = new Preprocessor()

export function parseFile(
  source: string,
  fileName: string,
  options: any,
  parseScriptFn: ScriptParseFn
): void {
  const transformedSource = p.process(source, {filename: fileName})

  parseScriptFn(transformedSource.code)

  // extract template from transformed source to then run through hbs processor
  const parseResult = p.parse(source, {filename: fileName})

  for (let parsed of parseResult) {
    parseHbsFile(parsed.contents, fileName, options)
  }
}
