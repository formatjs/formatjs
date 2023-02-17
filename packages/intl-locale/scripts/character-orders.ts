import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'

import {getAllLocales} from './utils'

import type {Args} from './utils'

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

  const result: {[locale: string]: CharacterOrder} = {}

  const locales = await getAllLocales()
  for (const locale of locales) {
    const layoutData = await import(`cldr-misc-full/main/${locale}/layout.json`)
    const characterOrder = getCharacterOrder(layoutData, locale)
    if (characterOrder) {
      result[locale] = characterOrder
    }
  }

  const possibleValues = Object.values(result).reduce((acc, val) => {
    if (!acc.includes(val)) {
      acc.push(val)
    }

    return acc
  }, [] as string[])

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const characterOrders = ${JSON.stringify(result)} as const
export type CharacterOrder = '${possibleValues.join("' | '")}'`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
