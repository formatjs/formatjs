import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {XMLParser} from 'fast-xml-parser'
import parentLocaleData from 'cldr-core/supplemental/parentLocales.json' with {type: 'json'}

type Node = Record<string, unknown>
type Styles = Record<'full' | 'long' | 'medium' | 'short', string>
export interface IsoPatterns {
  dateFormats: Styles
  timeFormats: Styles
  dateTimeFormats: Styles & {
    availableFormats: Record<string, string>
    intervalFormats: Record<string, string | Record<string, string>>
  }
}

function nodes(value: unknown): Node[] {
  return (Array.isArray(value) ? value : [value]).filter(
    value => value !== null && typeof value === 'object'
  ) as Node[]
}

function text(value: unknown): string | undefined {
  const node = nodes(value)[0]
  if (
    !node ||
    node['@_draft'] === 'unconfirmed' ||
    node['@_draft'] === 'provisional'
  )
    return
  const result = node['#text']
  return typeof result === 'string' && result !== '↑↑↑' ? result : undefined
}

export function isoPatternSource(
  directory: string
): (locale: string) => IsoPatterns {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    alwaysCreateTextNode: true,
  })
  const cache = new Map<string, IsoPatterns>()
  const parents: Record<string, string> =
    parentLocaleData.supplemental.parentLocales.parentLocale
  function load(locale: string): IsoPatterns {
    const cached = cache.get(locale)
    if (cached) return cached
    const parent =
      locale === 'root'
        ? undefined
        : load(
            parents[locale] ||
              locale.split('-').slice(0, -1).join('-') ||
              'root'
          )
    const result: IsoPatterns = {
      dateFormats: {...parent?.dateFormats} as Styles,
      timeFormats: {...parent?.timeFormats} as Styles,
      dateTimeFormats: {
        ...parent?.dateTimeFormats,
        availableFormats: {...parent?.dateTimeFormats.availableFormats},
        intervalFormats: {...parent?.dateTimeFormats.intervalFormats},
      } as IsoPatterns['dateTimeFormats'],
    }
    const file = join(directory, `${locale.replaceAll('-', '_')}.xml`)
    if (existsSync(file)) {
      const document = parser.parse(readFileSync(file, 'utf8'))
      const calendar = nodes(document.ldml?.dates?.calendars?.calendar).find(
        node => node['@_type'] === 'iso8601'
      )
      if (calendar) {
        for (const [section, length, item] of [
          ['dateFormats', 'dateFormatLength', 'dateFormat'],
          ['timeFormats', 'timeFormatLength', 'timeFormat'],
          ['dateTimeFormats', 'dateTimeFormatLength', 'dateTimeFormat'],
        ] as const) {
          const source = nodes(calendar[section])[0]
          for (const node of nodes(source?.[length])) {
            const pattern = text(
              nodes(node[item]).find(
                node => !node['@_type'] || node['@_type'] === 'standard'
              )?.pattern
            )
            if (pattern !== undefined)
              result[section][node['@_type'] as keyof Styles] = pattern
          }
        }
        const dateTime = nodes(calendar.dateTimeFormats)[0]
        for (const node of nodes(
          nodes(dateTime?.availableFormats)[0]?.dateFormatItem
        )) {
          const pattern = text(node)
          if (pattern !== undefined && !node['@_alt'] && !node['@_count'])
            result.dateTimeFormats.availableFormats[String(node['@_id'])] =
              pattern
        }
        const intervals = nodes(dateTime?.intervalFormats)[0]
        const fallback = text(intervals?.intervalFormatFallback)
        if (fallback !== undefined)
          result.dateTimeFormats.intervalFormats.intervalFormatFallback =
            fallback
        for (const node of nodes(intervals?.intervalFormatItem)) {
          const key = String(node['@_id'])
          const previous = result.dateTimeFormats.intervalFormats[key]
          const ranges = typeof previous === 'object' ? {...previous} : {}
          for (const difference of nodes(node.greatestDifference)) {
            const pattern = text(difference)
            if (pattern !== undefined)
              ranges[String(difference['@_id'])] = pattern
          }
          result.dateTimeFormats.intervalFormats[key] = ranges
        }
      }
    }
    for (const section of [
      'dateFormats',
      'timeFormats',
      'dateTimeFormats',
    ] as const)
      for (const style of ['full', 'long', 'medium', 'short'] as const)
        if (!result[section][style])
          throw new Error(`Missing ISO 8601 ${section}.${style} for ${locale}`)
    cache.set(locale, result)
    return result
  }
  return load
}
