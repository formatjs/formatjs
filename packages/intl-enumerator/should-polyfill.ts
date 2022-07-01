type AvailablePolyfills =
  | 'getSupportedCalendars'
  | 'getSupportedCurrencies'
  | 'getSupportedNumberingSystems'
  | 'getSupportedRegions'
  | 'getSupportedScripts'
  | 'getSupportedTimeZones'
  | 'getSupportedUnits'

export function shouldPolyfill(polyfill: AvailablePolyfills): boolean {
  return !(polyfill in Intl)
}
