import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import currencyRegistry from 'cldr-bcp47/bcp47/currency.json' with {type: 'json'}
import availableLocales from 'cldr-core/availableLocales.json' with {type: 'json'}
import currenciesData from 'cldr-numbers-full/main/en/currencies.json' with {type: 'json'}
const english = currenciesData.main.en.numbers.currencies

async function main(args: minimist.ParsedArgs) {
  const {out} = args
  // ECMA-402 §6.4 also covers historical codes the active formatter supports.
  // https://tc39.es/ecma402/#sec-availablecanonicalcurrencies
  const currencies = new Set(Object.keys(english))
  for (const code of Object.keys(currencyRegistry.keyword.u.cu)) {
    if (/^[a-z]{3}$/.test(code)) currencies.add(code.toUpperCase())
  }
  const otherLocales = availableLocales.availableLocales.full.filter(
    locale => locale !== 'en'
  )
  const localeCurrencies = await Promise.all(
    otherLocales.map(async locale => {
      const {default: data} = (await import(
        `cldr-numbers-full/main/${locale}/currencies.json`,
        {with: {type: 'json'}}
      )) as {default: typeof currenciesData}
      return data.main[locale as 'en'].numbers.currencies
    })
  )
  // Some ISO codes have CLDR names outside English. Keep these candidates
  // and their translated locales so runtime probes can find them.
  const candidateLocales: Record<string, string[]> = {}
  for (const [index, data] of localeCurrencies.entries()) {
    for (const [code, {displayName}] of Object.entries(data)) {
      if (!/^[A-Z]{3}$/.test(code) || !displayName || displayName === code)
        continue
      const englishName = english[code as keyof typeof english]?.displayName
      if (englishName && englishName !== code) continue
      currencies.add(code)
      ;(candidateLocales[code] ??= ['en']).push(otherLocales[index])
    }
  }

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const currencies = ${JSON.stringify([...currencies].sort())} as const
export type Currency = typeof currencies[number]
export const currencyCandidateLocales: Readonly<Record<string, readonly string[]>> = ${JSON.stringify(candidateLocales)}
    `
  )
}

if (import.meta.filename === process.argv[1]) {
  await main(minimist(process.argv))
}
