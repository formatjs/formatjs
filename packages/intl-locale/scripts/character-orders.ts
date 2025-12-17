import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'
import {getAllLocales} from './utils.js'

import type {Args} from './common-types.js'

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
    const layoutData = await import(`cldr-misc-full/main/${locale}/layout.json`)
    const characterOrder = getCharacterOrder(layoutData, locale)
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

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
