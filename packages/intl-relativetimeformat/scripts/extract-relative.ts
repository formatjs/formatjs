/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'

import * as DateFields from 'cldr-dates-full/main/en/dateFields.json' with {type: 'json'}
import * as NumberFields from 'cldr-numbers-full/main/en/numbers.json' with {type: 'json'}
import glob from 'fast-glob'
import {resolve, dirname} from 'path'
import {type FieldData, type LocaleFieldsData} from '@formatjs/ecma402-abstract'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json' with {type: 'json'}

// The set of CLDR date field names that are used in FormatJS.
const FIELD_NAMES = [
  'year',
  'year-short',
  'year-narrow',
  'quarter',
  'quarter-short',
  'quarter-narrow',
  'month',
  'month-short',
  'month-narrow',
  'week',
  'week-short',
  'week-narrow',
  'day',
  'day-short',
  'day-narrow',
  'hour',
  'hour-short',
  'hour-narrow',
  'minute',
  'minute-short',
  'minute-narrow',
  'second',
  'second-short',
  'second-narrow',
]

type Fields = (typeof DateFields)['main']['en']['dates']['fields']

export async function getAllLocales(): Promise<string[]> {
  const fns = await glob('*/dateFields.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    ),
  })
  return fns.map(dirname).filter(l => {
    try {
      return (Intl as any).getCanonicalLocales(l).length
    } catch {
      console.warn(`Invalid locale ${l}`)
      return false
    }
  })
}

async function loadRelativeFields(locale: string): Promise<LocaleFieldsData> {
  const [dateFileds, numbers] = await Promise.all([
    import(`cldr-dates-full/main/${locale}/dateFields.json`) as Promise<
      typeof DateFields
    >,
    import(`cldr-numbers-full/main/${locale}/numbers.json`).catch(
      _ => undefined
    ) as Promise<typeof NumberFields | undefined>,
  ])
  const fields = dateFileds.main[locale as 'en'].dates.fields
  const nu = numbers?.main[locale as 'en'].numbers.defaultNumberingSystem

  // Reduce the date fields data down to allowlist of fields needed in the
  // FormatJS libs.
  return FIELD_NAMES.reduce(
    (relative: LocaleFieldsData, field) => {
      // Transform the fields data from the CLDR structure to one that's
      // easier to override and customize (if needed). This is also required
      // back-compat in v1.x of the FormatJS libs.
      relative[field as 'year'] = transformFieldData(fields[field as 'week'])
      return relative
    },
    {
      nu: [nu],
    } as LocaleFieldsData
  )
}

// Transforms the CLDR's data structure for the relative fields into a structure
// that's more concise and easier to override to supply custom data.
function transformFieldData(data: Fields['week']): FieldData {
  const processed: FieldData = {
    future: {},
    past: {},
  }
  Object.keys(data).forEach(function (key) {
    const type = key.match(/^(relative|relativeTime)-type-(.+)$/) || []

    switch (type[1]) {
      case 'relative':
        processed[type[2] as '0'] = data[key as 'relative-type-0']
        break

      case 'relativeTime':
        processed[type[2] as 'past'] = Object.keys(
          data[key as 'relativeTime-type-past']
        ).reduce((counts: FieldData['past'], count) => {
          const k = count.replace('relativeTimePattern-count-', '')
          counts[k as 'other'] =
            data[key as 'relativeTime-type-past'][
              count as 'relativeTimePattern-count-other'
            ]
          return counts
        }, {})

        break
    }
  })

  return processed
}

export async function extractRelativeFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, LocaleFieldsData>> {
  const data = await Promise.all(locales.map(loadRelativeFields))
  return locales.reduce((all: Record<string, LocaleFieldsData>, locale, i) => {
    all[locale] = data[i]
    return all
  }, {})
}
