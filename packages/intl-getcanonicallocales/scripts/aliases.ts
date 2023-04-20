import {outputFileSync} from 'fs-extra'
import * as aliases from 'cldr-core/supplemental/aliases.json'
import minimist from 'minimist'
import stringify from 'json-stable-stringify'

const {languageAlias, territoryAlias, scriptAlias, variantAlias} =
  aliases.supplemental.metadata.alias

function main({out}: minimist.ParsedArgs) {
  const data = {
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

if (require.main === module) {
  main(minimist(process.argv))
}
