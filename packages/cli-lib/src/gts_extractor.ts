import {Preprocessor} from 'content-tag'
import {parseFile as parseHbsFile} from './hbs_extractor.js'
import {parseScript} from './parse_script.js'
let p = new Preprocessor()

export function parseFile(
  source: string,
  fileName: string,
  options: any
): void {
  const scriptParseFn = parseScript(options, fileName)
  const transformedSource = p.process(source, {filename: fileName})

  scriptParseFn(transformedSource.code)

  // extract template from transformed source to then run through hbs processor
  const parseResult = p.parse(source, {filename: fileName})

  for (let parsed of parseResult) {
    parseHbsFile(parsed.contents, fileName, options)
  }
}
