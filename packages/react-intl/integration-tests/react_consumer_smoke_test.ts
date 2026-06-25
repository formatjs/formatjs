import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

const requireFromConsumer = createRequire(
  path.join(process.cwd(), 'react-consumer-smoke.cjs')
)

function requireDefaultOrNamespace(specifier: string) {
  const mod = requireFromConsumer(specifier)
  return mod.default ?? mod
}

async function importReactIntl(entry: string) {
  const packageDir = process.argv[2]
  if (packageDir) {
    return import(pathToFileURL(path.join(packageDir, entry)).href)
  }

  const specifier = entry === 'index.js' ? 'react-intl' : 'react-intl/server'
  return import(pathToFileURL(requireFromConsumer.resolve(specifier)).href)
}

const React = requireDefaultOrNamespace('react')
const ReactDOMServer = requireFromConsumer('react-dom/server')
const ReactIntl = await importReactIntl('index.js')
const ReactIntlServer = await importReactIntl('server.js')

const {
  FormattedDate,
  FormattedMessage,
  IntlProvider,
  createIntl,
  createIntlCache,
  defineMessage,
  useIntl,
} = ReactIntl
const {
  createIntl: createServerIntl,
  createIntlCache: createServerIntlCache,
  defineMessage: defineServerMessage,
} = ReactIntlServer

const messages = {
  rich: 'Important <strong>{name}</strong>',
  title: 'Hello, {name}',
}
const value = new Date(Date.UTC(2020, 0, 2))

function SmokeChild() {
  const intl = useIntl()
  const descriptor = defineMessage({id: 'title'})

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'p',
      {id: 'hook-message'},
      intl.formatMessage(descriptor, {name: 'Ada'})
    ),
    React.createElement(FormattedMessage, {
      id: 'rich',
      values: {
        name: 'Ada',
        strong: (chunks: unknown) =>
          React.createElement('strong', null, chunks),
      },
    }),
    React.createElement(FormattedDate, {
      timeZone: 'UTC',
      value,
      year: 'numeric',
    })
  )
}

const html = ReactDOMServer.renderToString(
  React.createElement(
    IntlProvider,
    {
      locale: 'en',
      messages,
      onError(error: Error) {
        throw error
      },
      timeZone: 'UTC',
    },
    React.createElement('main', null, React.createElement(SmokeChild))
  )
)

assert.match(html, /Hello, Ada/)
assert.match(html, /Important/)
assert.match(html, /<strong>Ada<\/strong>/)
assert.match(html, /2020/)

const intl = createIntl(
  {
    locale: 'en',
    messages,
    timeZone: 'UTC',
  },
  createIntlCache()
)
assert.equal(intl.formatMessage({id: 'title'}, {name: 'Ada'}), 'Hello, Ada')

const serverIntl = createServerIntl(
  {
    locale: 'en',
    messages,
    timeZone: 'UTC',
  },
  createServerIntlCache()
)
assert.equal(
  serverIntl.formatMessage(defineServerMessage({id: 'title'}), {
    name: 'Grace',
  }),
  'Hello, Grace'
)
