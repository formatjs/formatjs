import {expect, test, vi} from 'vitest'
import {
  createIntl,
  createIntlCache,
  defineMessage,
  defineMessages,
} from '../index.js'

// Mock Svelte's context API to test provideIntl/useIntl
const contextMap = new Map<symbol, unknown>()
vi.mock('svelte', () => ({
  setContext: (key: symbol, value: unknown) => contextMap.set(key, value),
  getContext: (key: symbol) => contextMap.get(key),
}))

// Import after mocking
const {provideIntl, useIntl, intlKey} = await import('../index.js')

test('provideIntl + useIntl round-trip', function () {
  contextMap.clear()
  const intl = createIntl({
    locale: 'en',
    defaultLocale: 'en',
    messages: {
      foo: 'Hello, {name}!',
    },
  })
  provideIntl(intl)
  const retrieved = useIntl()
  expect(retrieved).toBe(intl)
  expect(retrieved.formatMessage({id: 'foo'}, {name: 'World'})).toBe(
    'Hello, World!'
  )
})

test('useIntl throws without provider', function () {
  contextMap.clear()
  expect(() => useIntl()).toThrow(
    'An intl object was not provided. Use provideIntl in an ancestor component.'
  )
})

test('intlKey is a symbol', function () {
  expect(typeof intlKey).toBe('symbol')
})

test('createIntl re-export works', function () {
  const cache = createIntlCache()
  const intl = createIntl(
    {
      locale: 'en',
      defaultLocale: 'en',
      messages: {
        greeting: 'Hello, {name}!',
      },
    },
    cache
  )
  expect(intl.formatMessage({id: 'greeting'}, {name: 'World'})).toBe(
    'Hello, World!'
  )
})

test('defineMessages returns input', function () {
  const msgs = defineMessages({
    greeting: {
      id: 'greeting',
      defaultMessage: 'Hello',
    },
  })
  expect(msgs.greeting.id).toBe('greeting')
})

test('defineMessage returns input', function () {
  const msg = defineMessage({
    id: 'single',
    defaultMessage: 'Single',
  })
  expect(msg.id).toBe('single')
})
