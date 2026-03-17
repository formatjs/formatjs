import {DisplayNames} from './index.js'
import {shouldPolyfill} from './should-polyfill.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  })

  // Drain any locale data that was buffered before polyfill loaded
  const buf = (globalThis as Record<string, unknown>)
    .__FORMATJS_DISPLAYNAMES_DATA__ as
    | Parameters<(typeof DisplayNames)['__addLocaleData']>[0][]
    | undefined
  if (buf) {
    for (const d of buf) DisplayNames.__addLocaleData(d)
    delete (globalThis as Record<string, unknown>)
      .__FORMATJS_DISPLAYNAMES_DATA__
  }
}
