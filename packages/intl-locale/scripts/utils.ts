import glob from 'fast-glob'
import {resolve, dirname} from 'path'

import type {ParsedArgs} from 'minimist'

export interface Args extends ParsedArgs {
  zone: string[]
}

export async function getAllLocales(): Promise<string[]> {
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
