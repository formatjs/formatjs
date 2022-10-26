/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'
import * as Numbers from 'cldr-numbers-full/main/en/numbers.json'
import glob from 'fast-glob'
import {resolve, dirname} from 'path'
import {DurationLocaleData} from '@formatjs/ecma402-abstract'

export type NumberTypes = typeof Numbers['main']['en']['numbers']

export async function getAllLocales(): Promise<string[]> {
  const fns = await glob('*/numbers.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-numbers-full/package.json')),
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

async function loadLocaleData(locale: string): Promise<DurationLocaleData> {
  const patterns = (
    (await import(
      `cldr-numbers-full/main/${locale}/numbers.json`
    )) as typeof Numbers
  ).main[locale as 'en'].numbers
  const numberSystem = patterns['defaultNumberingSystem'] as 'latn'
  return {
    nu:
      'otherNumberingSystems' in patterns
        ? Object.values(patterns['otherNumberingSystems'])
        : [],
    digitalFormat: {
      separator:
        patterns[`symbols-numberSystem-${numberSystem}`]['timeSeparator'],
    },
  }
}

export async function extractLocaleData(
  locales: string[]
): Promise<Record<string, DurationLocaleData>> {
  const data = await Promise.all(locales.map(loadLocaleData))
  return locales.reduce(
    (all: Record<string, DurationLocaleData>, locale, i) => {
      all[locale] = data[i]
      return all
    },
    {}
  )
}
