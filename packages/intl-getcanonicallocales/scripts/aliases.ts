import {readFileSync, readdirSync} from 'node:fs'
import {outputFileSync} from 'fs-extra/esm'
import aliases from 'cldr-core/supplemental/aliases.json' with {type: 'json'}
import minimist from 'minimist'
import stringify from 'json-stable-stringify'

const {
  languageAlias,
  territoryAlias,
  scriptAlias,
  variantAlias,
  subdivisionAlias,
} = aliases.supplemental.metadata.alias

const UNICODE_TYPE = /^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/

interface Args extends minimist.ParsedArgs {
  out: string
}

interface TypeData {
  _alias?: string
  _preferred?: string
}

function main(args: Args) {
  const {out} = args
  const extensionAlias: Record<
    string,
    Record<string, Record<string, string>>
  > = {}
  const directory = new URL(
    './bcp47/',
    import.meta.resolve('cldr-bcp47/package.json')
  )
  for (const file of readdirSync(directory).sort()) {
    if (!file.endsWith('.json')) continue
    const {keyword} = JSON.parse(
      readFileSync(new URL(file, directory), 'utf8')
    ) as {
      keyword: Record<string, Record<string, Record<string, TypeData | string>>>
    }
    for (const [extension, keys] of Object.entries(keyword)) {
      for (const [key, types] of Object.entries(keys)) {
        for (const [type, metadata] of Object.entries(types)) {
          if (typeof metadata !== 'object') continue
          const canonical = metadata._preferred || type
          for (const alias of [type, ...(metadata._alias || '').split(' ')]) {
            const normalized = alias.toLowerCase()
            if (normalized === canonical || !UNICODE_TYPE.test(normalized))
              continue
            ;((extensionAlias[extension] ||= {})[key] ||= {})[normalized] =
              canonical
          }
        }
      }
    }
  }
  const data = {
    subdivisionAlias: Object.fromEntries(
      Object.entries(subdivisionAlias).map(([alias, value]) => {
        const first = value._replacement.split(' ')[0].toLowerCase()
        return [alias, first.length === 2 ? first + 'zzzz' : first]
      })
    ),
    extensionAlias,
    languageAlias: Object.keys(languageAlias).reduce(
      (all: Record<string, string>, locale) => {
        all[locale] = languageAlias[locale as 'zh-cmn']._replacement
        return all
      },
      {}
    ),
    territoryAlias: Object.keys(territoryAlias).reduce(
      (all: Record<string, string>, locale) => {
        all[locale] = territoryAlias[locale as '004']._replacement
        return all
      },
      {}
    ),
    scriptAlias: Object.keys(scriptAlias).reduce(
      (all: Record<string, string>, locale) => {
        all[locale] = scriptAlias[locale as 'Qaai']._replacement
        return all
      },
      {}
    ),
    variantAlias: Object.keys(variantAlias).reduce(
      (all: Record<string, string>, locale) => {
        all[locale] = variantAlias[locale as 'heploc']._replacement
        return all
      },
      {}
    ),
  }

  outputFileSync(
    out,
    `/* @generated */	
// prettier-ignore  
export const subdivisionAlias: Record<string, string> = ${stringify(data.subdivisionAlias, {space: 2})};
export const extensionAlias: Record<string, Record<string, Record<string, string>>> = ${stringify(data.extensionAlias, {space: 2})};
export const languageAlias: Record<string, string> = ${stringify(
      data.languageAlias,
      {space: 2}
    )};
export const territoryAlias: Record<string, string> = ${stringify(
      data.territoryAlias,
      {space: 2}
    )};
export const scriptAlias: Record<string, string> = ${stringify(
      data.scriptAlias,
      {space: 2}
    )};
export const variantAlias: Record<string, string> = ${stringify(
      data.variantAlias,
      {space: 2}
    )};
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
