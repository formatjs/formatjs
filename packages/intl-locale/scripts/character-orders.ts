import glob from 'fast-glob'
import minimist from 'minimist'
import {resolve, dirname} from 'path'
import {outputFileSync} from 'fs-extra'

type CharacterOrder = 'left-to-right' | 'right-to-left'

type CldrMiscLayout = {
  main: {
    [locale: string]: {
      layout: {
        orientation: {
          characterOrder: CharacterOrder
        }
      }
    }
  }
} | undefined

interface Args extends minimist.ParsedArgs {
  zone: string[]
}

async function getAllLocales(): Promise<string[]> {
  const fns = await glob('*/localeDisplayNames.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-localenames-full/package.json')),
      './main'
    ),
  })

  return fns.map(dirname).filter(l => {
    try {
      return (Intl as any).getCanonicalLocales(l).length
    } catch (e) {
      console.warn(`Invalid locale ${l}`)
      return false
    }
  })
}

function getCharacterOrder(layoutData: CldrMiscLayout, locale: string): CharacterOrder | undefined {
  return layoutData?.main[locale].layout.orientation.characterOrder
}

async function main(args: Args) {
  const {out} = args

  const result: { [locale: string]: CharacterOrder } = {}

  const locales = await getAllLocales()
  for (const locale of locales) {
      const layoutData = await import(`cldr-misc-full/main/${locale}/Layout.json`)
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
export type CharacterOrder = '${possibleValues.join('\' | \'')}'`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
