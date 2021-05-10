/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'
import * as ListPatterns from 'cldr-misc-full/main/en/listPatterns.json'
import glob from 'fast-glob'
import {resolve, dirname} from 'path'
import {ListPatternFieldsData, ListPattern} from '@formatjs/ecma402-abstract'

export type ListTypes = typeof ListPatterns['main']['en']['listPatterns']

export async function getAllLocales(): Promise<string[]> {
  const fns = await glob('*/listPatterns.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-misc-full/package.json')),
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

function serializeToPatternData(
  d: ListTypes['listPattern-type-standard']
): ListPattern {
  return {
    start: d.start,
    middle: d.middle,
    end: d.end,
    pair: d['2'],
  }
}

async function loadListPatterns(
  locale: string
): Promise<ListPatternFieldsData> {
  const patterns = (
    (await import(
      `cldr-misc-full/main/${locale}/listPatterns.json`
    )) as typeof ListPatterns
  ).main[locale as 'en'].listPatterns
  return {
    conjunction: {
      long: serializeToPatternData(patterns['listPattern-type-standard']),
      short: serializeToPatternData(
        patterns['listPattern-type-standard-short']
      ),
      narrow: serializeToPatternData(
        patterns['listPattern-type-standard-narrow']
      ),
    },
    disjunction: {
      long: serializeToPatternData(patterns['listPattern-type-or']),
      short: serializeToPatternData(patterns['listPattern-type-or-short']),
      narrow: serializeToPatternData(patterns['listPattern-type-or-narrow']),
    },
    unit: {
      long: serializeToPatternData(patterns['listPattern-type-unit']),
      short: serializeToPatternData(patterns['listPattern-type-unit-short']),
      narrow: serializeToPatternData(patterns['listPattern-type-unit-narrow']),
    },
  }
}

export async function extractLists(
  locales: string[]
): Promise<Record<string, ListPatternFieldsData>> {
  const data = await Promise.all(locales.map(loadListPatterns))
  return locales.reduce(
    (all: Record<string, ListPatternFieldsData>, locale, i) => {
      all[locale] = data[i]
      return all
    },
    {}
  )
}
