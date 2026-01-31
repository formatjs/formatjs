import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'
import {getAllLocales} from './utils.ts'

import type {Args} from './common-types.ts'

type CharacterOrder = 'left-to-right' | 'right-to-left'

type CldrMiscLayout =
  | {
      main: {
        [locale: string]: {
          layout: {
            orientation: {
              characterOrder: CharacterOrder
            }
          }
        }
      }
    }
  | undefined

function getCharacterOrder(
  layoutData: CldrMiscLayout,
  locale: string
): CharacterOrder | undefined {
  return layoutData?.main[locale].layout.orientation.characterOrder
}

async function main(args: Args) {
  const {out} = args

  const characterOrders: {[locale: string]: CharacterOrder} = {}

  const locales = await getAllLocales()
  for (const locale of locales) {
    const layoutDataImport = (await import(
      `cldr-misc-full/main/${locale}/layout.json`,
      {with: {type: 'json'}}
    )) as {default: CldrMiscLayout}
    const characterOrder = getCharacterOrder(layoutDataImport.default, locale)
    if (characterOrder) {
      characterOrders[locale] = characterOrder
    }
  }

  const possibleValues = Object.values(characterOrders)
    .reduce((acc, val) => {
      if (!acc.includes(val)) {
        acc.push(val)
      }

      return acc
    }, [] as string[])
    .sort()

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const characterOrders = ${stringify(characterOrders, {
      space: 2,
      cmp: (a, b) => a.key.localeCompare(b.key),
    })} as const
export type CharacterOrdersKey = keyof typeof characterOrders
export type CharacterOrder = '${possibleValues.join("' | '")}'
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
