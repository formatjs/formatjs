import type ListFormat from '@formatjs/intl-listformat'
import {DurationFormat} from '#packages/intl-durationformat/core.js'
import {expect, test} from 'vitest'

test('uses a ListFormat polyfill installed after DurationFormat loads', async () => {
  const value = {minutes: 1, seconds: 2}
  expect(new DurationFormat('en', {style: 'long'}).format(value)).toBe(
    '1 minute, 2 seconds'
  )

  await import('@formatjs/intl-listformat/polyfill-force.js')
  const listFormat = Intl.ListFormat as unknown as typeof ListFormat
  listFormat.__addLocaleData({
    locale: 'en',
    data: {
      unit: {
        long: {
          start: '{0} / {1}',
          middle: '{0} / {1}',
          end: '{0} / {1}',
          pair: '{0} / {1}',
        },
      },
    },
  })
  expect(new DurationFormat('en', {style: 'long'}).format(value)).toBe(
    '1 minute / 2 seconds'
  )
})
