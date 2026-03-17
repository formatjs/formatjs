import RelativeTimeFormat from './index.js'
import {shouldPolyfill} from './should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })

  // Drain any locale data that was buffered before polyfill loaded
  const buf = (globalThis as Record<string, unknown>)
    .__FORMATJS_RELATIVETIMEFORMAT_DATA__ as
    | Parameters<(typeof RelativeTimeFormat)['__addLocaleData']>[0][]
    | undefined
  if (buf) {
    for (const d of buf) RelativeTimeFormat.__addLocaleData(d)
    delete (globalThis as Record<string, unknown>)
      .__FORMATJS_RELATIVETIMEFORMAT_DATA__
  }
}
