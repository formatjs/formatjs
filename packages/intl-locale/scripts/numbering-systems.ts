import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'

import {getAllLocales} from './utils.ts'

import type {Args} from './common-types.ts'

type CldrNumbersNumbers = {
  defaultNumberingSystem: string
  otherNumberingSystems: {
    [key: string]: string
  }
}

function getNumberingSystems(numbers: CldrNumbersNumbers): string[] {
  const {defaultNumberingSystem, otherNumberingSystems} = numbers
  const numberingSystems: string[] = defaultNumberingSystem
    ? [defaultNumberingSystem]
    : []

  if (otherNumberingSystems) {
    for (const ns of Object.values(otherNumberingSystems)) {
      if (!numberingSystems.includes(ns)) {
        numberingSystems.push(ns)
      }
    }
  }

  return numberingSystems
}

async function main(args: Args) {
  const {out} = args

  const result: {[locale: string]: string[]} = {}

  const locales = await getAllLocales()
  for (const locale of locales) {
    const numbersDataImport = (await import(
      `cldr-numbers-full/main/${locale}/numbers.json`,
      {with: {type: 'json'}}
    )) as {default: {main: {[key: string]: {numbers: CldrNumbersNumbers}}}}
    result[locale] = getNumberingSystems(
      numbersDataImport.default.main[locale].numbers
    )
  }

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const numberingSystems = ${stringify(result, {space: 2})} as const
export type NumberingSystemsKey = keyof typeof numberingSystems`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
