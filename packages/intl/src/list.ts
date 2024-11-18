import {ErrorCode, FormatError} from 'intl-messageformat'
import {IntlFormatError} from './error'
import {Formatters, IntlFormatters, OnErrorFn, Part} from './types'
import {filterProps} from './utils'

const LIST_FORMAT_OPTIONS: Array<keyof Intl.ListFormatOptions> = [
  'type',
  'style',
]

const now = Date.now()

function generateToken(i: number): string {
  return `${now}_${i}_${now}`
}

export function formatList(
  opts: {
    locale: string
    onError: OnErrorFn
  },
  getListFormat: Formatters['getListFormat'],
  values: ReadonlyArray<string>,
  options: Parameters<IntlFormatters['formatList']>[1]
): string
export function formatList<T>(
  opts: {
    locale: string
    onError: OnErrorFn
  },
  getListFormat: Formatters['getListFormat'],
  values: ReadonlyArray<string | T>,
  options: Parameters<IntlFormatters['formatList']>[1] = {}
): Array<T | string> | T | string {
  const results = formatListToParts(
    opts,
    getListFormat,
    values,
    options
  ).reduce((all: Array<string | T>, el) => {
    const val = el.value
    if (typeof val !== 'string') {
      all.push(val)
    } else if (typeof all[all.length - 1] === 'string') {
      all[all.length - 1] += val
    } else {
      all.push(val)
    }
    return all
  }, [])
  return results.length === 1 ? results[0] : results.length === 0 ? '' : results
}

export function formatListToParts<T>(
  opts: {
    locale: string
    onError: OnErrorFn
  },
  getListFormat: Formatters['getListFormat'],
  values: ReadonlyArray<string | T>,
  options: Parameters<IntlFormatters['formatList']>[1]
): Part[]
export function formatListToParts<T>(
  {
    locale,
    onError,
  }: {
    locale: string
    onError: OnErrorFn
  },
  getListFormat: Formatters['getListFormat'],
  values: Parameters<IntlFormatters['formatList']>[0],
  options: Parameters<IntlFormatters['formatList']>[1] = {}
): Part<T>[] {
  const ListFormat: typeof Intl.ListFormat = Intl.ListFormat
  if (!ListFormat) {
    onError(
      new FormatError(
        `Intl.ListFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-listformat"
`,
        ErrorCode.MISSING_INTL_API
      )
    )
  }
  const filteredOptions = filterProps(
    options,
    LIST_FORMAT_OPTIONS
  ) as Intl.ListFormatOptions

  try {
    const richValues: Record<string, T> = {}
    const serializedValues = values.map((v, i) => {
      if (typeof v === 'object') {
        const id = generateToken(i)
        richValues[id] = v as any
        return id
      }
      return String(v)
    })
    return getListFormat(locale, filteredOptions)
      .formatToParts(serializedValues)
      .map(
        part =>
          (part.type === 'literal'
            ? part
            : {...part, value: richValues[part.value] || part.value}) as Part<T>
      )
  } catch (e) {
    onError(new IntlFormatError('Error formatting list.', locale, e))
  }

  // @ts-ignore
  return values
}
