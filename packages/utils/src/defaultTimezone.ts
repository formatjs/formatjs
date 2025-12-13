import {Cache, memoize, strategies} from '@formatjs/fast-memoize'

const cache: Record<string, Intl.DateTimeFormat> = {}

function createFastMemoizeCache<V>(
  store: Record<string, V | undefined>
): Cache<string, V> {
  return {
    create() {
      return {
        get(key) {
          return store[key]
        },
        set(key, value) {
          store[key] = value
        },
      }
    },
  }
}

type DTFParameters = ConstructorParameters<typeof Intl.DateTimeFormat>

const getDateTimeFormat: (...args: DTFParameters) => Intl.DateTimeFormat =
  memoize((...args: DTFParameters) => new Intl.DateTimeFormat(...args), {
    cache: createFastMemoizeCache(cache),
    strategy: strategies.variadic,
  })

const now = Date.now()

/**
 * Return the localized default timezone for the system. If `timeZoneName` is not supported, return the IANA timezone name.
 * @param dateDateTimeFormatCreator creator fn for Intl.DateTimeFormat
 * @returns default timezone for the system
 */
export function defaultTimezone(
  locales?: DTFParameters[0],
  options?: Pick<Intl.DateTimeFormatOptions, 'timeZoneName'>
): string {
  const timeZoneName = options?.timeZoneName
  try {
    const dtf = getDateTimeFormat(locales, {
      timeZoneName: options?.timeZoneName,
    })
    // If there's no `timeZoneName` specified, return the IANA timezone name
    if (!timeZoneName) {
      return dtf.resolvedOptions().timeZone
    }
    // If `timeZoneName` is specified, return the localized timezone name
    return (
      dtf.formatToParts(now).find(p => p.type === 'timeZoneName')?.value ||
      'UTC'
    )
  } catch {
    return 'UTC'
  }
}
