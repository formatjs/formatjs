import {parseFile as parseHbsFile} from './hbs_extractor.mjs'
import {parseScript} from './parse_script.js'
import {Preprocessor} from 'content-tag'
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
