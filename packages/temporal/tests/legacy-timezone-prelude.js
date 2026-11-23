// Model an older Intl installation independently of Temporal's timezone provider.
const legacyTimeZoneNative = Intl.DateTimeFormat
globalThis.__formatjsTimezoneNative = legacyTimeZoneNative
let legacyTimeZoneFaults = 0
Intl.DateTimeFormat = new Proxy(legacyTimeZoneNative, {
  construct(target, args) {
    const [locales, options] = args
    const wrapped =
      options &&
      new Proxy(options, {
        get(source, key) {
          const value = Reflect.get(source, key)
          if (key !== 'timeZone') return value
          if (value === 'America/Coyhaique' || /^[+-]/.test(value)) {
            legacyTimeZoneFaults++
            throw new RangeError('Timezone absent from simulated older Intl')
          }
          const stale = {
            'America/Havana': 'Etc/GMT+5',
            'Asia/Kathmandu': 'Etc/GMT-6',
            'Africa/Monrovia': 'Etc/GMT+1',
          }[value]
          if (stale) legacyTimeZoneFaults++
          return stale || value
        },
      })
    return new target(locales, wrapped)
  },
})
globalThis.__formatjsTimezoneFaults = () => legacyTimeZoneFaults
