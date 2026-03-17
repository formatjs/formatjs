import ListFormat from './index.js'
import {shouldPolyfill} from './should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'ListFormat', {
    value: ListFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })

  // Drain any locale data that was buffered before polyfill loaded
  const buf = (globalThis as Record<string, unknown>)
    .__FORMATJS_LISTFORMAT_DATA__ as
    | Parameters<(typeof ListFormat)['__addLocaleData']>[0][]
    | undefined
  if (buf) {
    for (const d of buf) ListFormat.__addLocaleData(d)
    delete (globalThis as Record<string, unknown>).__FORMATJS_LISTFORMAT_DATA__
  }
}
