import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import calendarData from 'cldr-bcp47/bcp47/calendar.json' with {type: 'json'}
import preferences from 'cldr-core/supplemental/calendarPreferenceData.json' with {type: 'json'}
import likelySubtags from 'cldr-core/supplemental/likelySubtags.json' with {type: 'json'}

interface Args extends minimist.ParsedArgs {
  out: string
}

const {keyword} = calendarData
function main(args: Args) {
  const {out} = args
  const types = keyword.u.ca as Record<
    string,
    {_alias?: string; _preferred?: string}
  >
  // ECMA-402 §8.3.2 step 2.b excludes calendar aliases.
  // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
  const calendars = Object.keys(types).filter(
    key => !key.startsWith('_') && !types[key]._preferred
  )
  const names = new Map<string, string>()
  const candidates = new Map<string, Set<string>>()
  for (const calendar of calendars) {
    names.set(calendar, calendar)
    for (const alias of types[calendar]._alias?.split(' ') ?? [])
      names.set(alias, calendar)
    candidates.set(calendar, new Set(['en']))
  }
  // UTS #35 Calendar Preference Data identifies calendars used by territory.
  // Probe the territory's likely locale and its shorter forms.
  // https://unicode.org/reports/tr35/tr35-dates.html#Calendar_Preference_Data
  const likely = likelySubtags.supplemental.likelySubtags as Record<
    string,
    string
  >
  const regionalLanguages = new Set<string>()
  for (const [region, preferred] of Object.entries(
    preferences.supplemental.calendarPreferenceData
  )) {
    const locale = likely[`und-${region}`]
    if (!locale) continue
    const [language] = locale.split('-')
    regionalLanguages.add(language)
    for (const name of preferred) {
      const locales = candidates.get(names.get(name) ?? name)
      locales?.add(language).add(`${language}-${region}`).add(locale)
    }
  }
  // Some calendars, such as ethioaa, have no preference row of their own.
  for (const [calendar, locales] of candidates) {
    if (calendar !== 'iso8601' && locales.size === 1)
      for (const locale of regionalLanguages) locales.add(locale)
  }
  const calendarCandidateLocales = Object.fromEntries(
    Array.from(candidates, ([calendar, locales]) => [calendar, [...locales]])
  )

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const calendars = ${JSON.stringify(calendars)} as const
// prettier-ignore
export const calendarCandidateLocales = ${JSON.stringify(calendarCandidateLocales)} as const
export type Calendar = typeof calendars[number]
    `
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
