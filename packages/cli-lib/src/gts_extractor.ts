// @ts-ignore
import {transform, parseTemplates} from 'ember-template-tag'
import {parseFile as parseHbsFile} from './hbs_extractor'
import {parseScript} from './parse_script'

export function parseFile(source: string, fileName: string, options: any) {
  const scriptParseFn = parseScript(options, fileName)
  const {output: transformedSource} = transform({
    input: source,
    relativePath: '',
  })

  scriptParseFn(transformedSource)

  // extract template from transformed source to then run through hbs processor
  const [templateSource] = parseTemplates(source, '')

  parseHbsFile(templateSource.contents, fileName, options)
}
