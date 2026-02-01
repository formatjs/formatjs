import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'

import type arData from 'cldr-numbers-full/main/ar/numbers.json' with {type: 'json'}
import {getAllLocales} from './utils.ts'

type RawData = typeof arData

interface Args {
  out: string
}

async function main(args: Args) {
  const {out} = args

  const result: {
    default: string
    localeData: Record<
      string,
      {
        nu: string[]
        separator?: Record<string, string>
      }
    >
  } = {
    default: ':',
    localeData: {},
  }

  const locales = await getAllLocales()
  for (const locale of locales) {
    const rawDataImport = (await import(
      `cldr-numbers-full/main/${locale}/numbers.json`,
      {with: {type: 'json'}}
    )) as {default: RawData}
    const rawData = rawDataImport.default
    const numbersData = rawData.main[locale as 'ar'].numbers
    const numberingSystems = [
      numbersData.defaultNumberingSystem,
      numbersData['defaultNumberingSystem-alt-latn'],
    ].filter(Boolean)
    result.localeData[locale] = {
      nu: numberingSystems,
    }
    const localeData = numberingSystems.reduce<Record<string, string>>(
      (all, numberingSystem) => {
        const separator =
          numbersData[
            `symbols-numberSystem-${numberingSystem}` as 'symbols-numberSystem-latn'
          ].timeSeparator
        if (separator !== ':') {
          all[numberingSystem] = separator
        }
        return all
      },
      {}
    )

    if (Object.keys(localeData).length) {
      result.localeData[locale].separator = localeData
    }
  }

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const TIME_SEPARATORS = ${stringify(result, {space: 2})} as const
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
