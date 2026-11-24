import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'

import type arData from 'cldr-numbers-full/main/ar/numbers.json' with {type: 'json'}
import {getAllLocales} from './utils.ts'

type RawData = typeof arData

interface Args extends minimist.ParsedArgs {
  out: string
}

interface LocaleData {
  nu: string[]
  separator?: Record<string, string>
}

// ECMA-402 §9.1 requires parent locales and the scriptless region. Preserve
// explicit records and prefer the likely script when several records can supply
// the same scriptless region.
// https://tc39.es/ecma402/#sec-internal-slots
function addFallbackLocales(localeData: Record<string, LocaleData>): void {
  const locales = Object.keys(localeData).sort()
  const explicit = new Set(locales)
  for (const locale of locales) {
    const parts = locale.split('-')
    const {language, script} = new Intl.Locale(locale)
    const data = localeData[locale]
    while (parts.length > 1) {
      if (script && parts.length > 2) {
        const alias = [language, ...parts.slice(2)].join('-')
        if (
          !explicit.has(alias) &&
          (!localeData[alias] ||
            new Intl.Locale(alias).maximize().script === script)
        ) {
          localeData[alias] = data
        }
      }
      parts.pop()
      localeData[parts.join('-')] ??= data
    }
  }
}

async function main(args: Args) {
  const {out} = args

  const result: {
    default: string
    localeData: Record<string, LocaleData>
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
    const symbolSystems = Object.keys(numbersData)
      .filter(key => key.startsWith('symbols-numberSystem-'))
      .map(key => key.slice('symbols-numberSystem-'.length))
    const localeData = symbolSystems.reduce<Record<string, string>>(
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

  addFallbackLocales(result.localeData)
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
