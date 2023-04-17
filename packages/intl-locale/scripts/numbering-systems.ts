import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'

import {getAllLocales} from './utils'

import type {Args} from './common-types'

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
    const numbersData = await import(
      `cldr-numbers-full/main/${locale}/numbers.json`
    )
    result[locale] = getNumberingSystems(numbersData.main[locale].numbers)
  }

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const numberingSystems = ${stringify(result, {space: 2})} as const
export type NumberingSystemsKey = keyof typeof numberingSystems`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
