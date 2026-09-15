import {
  createIntl as createCoreIntl,
  type MessageDescriptor,
  type TextMessageFormatter,
} from '@formatjs/intl'
import * as React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect, expectTypeOf, test} from 'vitest'
import {
  createIntl,
  FormattedMessage,
  IntlProvider,
  defineMessage,
  defineMessages,
  type MessageTag,
  type MessageArgumentsFromCatalog,
  type TypedMessageDescriptor,
  type MessageValue,
  type MessageValuesOf,
} from '#packages/react-intl/index.js'
import {
  defineMessage as serverMessage,
  createIntl as serverIntl,
  type MessageValuesOf as ServerMessageValuesOf,
} from '#packages/react-intl/server.js'

const intl = createIntl({locale: 'en'})
const message = defineMessage<{count: number | bigint}>(
  {id: 'items', defaultMessage: '{count, number}'},
  {typed: true}
)

test('$t infers rich-text callbacks like formatMessage', () => {
  const descriptor = {id: 'alias-rich', defaultMessage: 'Hello <b>world</b>'}
  const result = intl.$t(descriptor, {b: chunks => <b>{chunks}</b>})
  expect(renderToStaticMarkup(<>{result}</>)).toBe('Hello <b>world</b>')
  expectTypeOf(intl.$t).toEqualTypeOf<typeof intl.formatMessage>()
})

test('typed helpers work through client and server entrypoints', () => {
  expect(intl.formatMessage(message, {count: 2})).toBe('2')
  const server = serverIntl({locale: 'en'})
  const descriptor = serverMessage<{name: MessageValue}>(
    {id: 'hello', defaultMessage: 'Hello {name}'},
    {typed: true}
  )
  expect(server.formatMessage(descriptor, {name: 'Ada'})).toBe('Hello Ada')
  const rich = defineMessage<{b: MessageTag}>(
    {id: 'rich', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  const result = intl.formatMessage(rich, {b: chunks => <b>{chunks}</b>})
  expect(React.isValidElement(result)).toBe(true)
  expect(
    React.isValidElement(intl.$t(rich, {b: chunks => <b>{chunks}</b>}))
  ).toBe(true)
})

type OriginalDefineMessage = <T extends MessageDescriptor>(
  message: T
) => Readonly<T>
type OriginalDefineMessages = <
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(
  messages: U
) => {readonly [P in keyof U]: Readonly<U[P]>}

function checkTypes() {
  // Plain descriptors do not infer ICU arguments without a generic.
  intl.$t({defaultMessage: '{count, number}'})
  intl.$t({defaultMessage: '{count, number}'}, {count: 'two'})
  intl.formatMessage({defaultMessage: '{count, number}'}, {other: true})
  // Typed helper descriptors retain their contract without a generic.
  // @ts-expect-error The carried contract requires count.
  intl.$t(message)

  const inline = intl.formatMessage<{b: MessageTag}, React.ReactNode>(
    {id: 'rich-hello', defaultMessage: '<b>Hello</b>'},
    {b: chunks => <b>{chunks}</b>}
  )
  expectTypeOf(inline).toMatchTypeOf<React.ReactNode>()
  intl.formatMessage<{b: MessageTag}>(
    {id: 'rich-hello', defaultMessage: '<b>Hello</b>'},
    {b: chunks => <b>{chunks}</b>}
  )
  intl.$t<{b: MessageTag}, React.ReactNode>(
    {id: 'rich-hello', defaultMessage: '<b>Hello</b>'},
    {b: chunks => <b>{chunks}</b>}
  )
  expectTypeOf(
    intl.formatMessage<{n: number}>({defaultMessage: '{n}'}, {n: 1})
  ).toEqualTypeOf<string>()
  // @ts-expect-error First generic is the ICU argument contract.
  intl.$t<React.ReactNode>({defaultMessage: 'Hello'})
  intl.formatMessage<{n: number}, React.ReactNode>(
    {defaultMessage: '{n}'},
    // @ts-expect-error Rich output type cannot weaken numeric inputs.
    {n: 'one'}
  )
  // @ts-expect-error Explicit inline contracts require values.
  intl.formatMessage<{n: number}>({defaultMessage: '{n}'})

  expectTypeOf<Parameters<typeof defineMessage>>().toEqualTypeOf<
    Parameters<OriginalDefineMessage>
  >()
  expectTypeOf<ReturnType<typeof defineMessage>>().toEqualTypeOf<
    ReturnType<OriginalDefineMessage>
  >()
  expectTypeOf<Parameters<typeof serverMessage>>().toEqualTypeOf<
    Parameters<OriginalDefineMessage>
  >()
  expectTypeOf<ReturnType<typeof serverMessage>>().toEqualTypeOf<
    ReturnType<OriginalDefineMessage>
  >()
  expectTypeOf<
    Parameters<
      typeof defineMessages<
        'hello',
        MessageDescriptor,
        Record<'hello', MessageDescriptor>
      >
    >
  >().toEqualTypeOf<[messages: Record<'hello', MessageDescriptor>]>()
  expectTypeOf<ReturnType<typeof defineMessages>>().toEqualTypeOf<
    ReturnType<OriginalDefineMessages>
  >()
  const wrapped = (...args: Parameters<typeof defineMessage>) =>
    defineMessage(...args)
  wrapped({id: 'wrapped'})
  // @ts-expect-error React helpers still require descriptors.
  defineMessage('not a descriptor')
  // @ts-expect-error Server helpers retain the same constraint.
  serverMessage('not a descriptor')

  expectTypeOf(intl.formatMessage(message, {count: 2})).toEqualTypeOf<string>()
  // @ts-expect-error Missing values cannot fall through to the legacy React overload.
  intl.formatMessage(message)
  // @ts-expect-error Wrong argument type.
  intl.formatMessage(message, {count: 'two'})
  // @ts-expect-error Wrong alias argument type.
  intl.$t(message, {count: 'two'})
  const rich = defineMessage<{b: MessageTag; value: MessageValue}>(
    {id: 'rich', defaultMessage: '<b>{value}</b>'},
    {typed: true}
  )
  expectTypeOf(
    intl.formatMessage(rich, {
      b: chunks => <b>{chunks}</b>,
      value: <i>Hello</i>,
    })
  ).toEqualTypeOf<React.ReactNode>()
  // @ts-expect-error A tag is not a string placeholder.
  intl.formatMessage(rich, {b: 'bold', value: 'hello'})
  // @ts-expect-error All placeholders, including tags, are required.
  intl.formatMessage(rich, {value: 'hello'})
  const server = serverIntl({locale: 'en'})
  // @ts-expect-error Server entrypoint enforces contracts too.
  server.formatMessage(message, {})
}
void checkTypes

test('client and server helpers preserve required metadata', () => {
  const client = defineMessage<{}>(
    {id: 'client', defaultMessage: 'Hello'},
    {typed: true}
  )
  const server = serverMessage<{}>(
    {id: 'server', defaultMessage: 'Hello'},
    {typed: true}
  )
  expectTypeOf(client.id).toMatchTypeOf<string>()
  expectTypeOf(client.defaultMessage).toMatchTypeOf<string>()
  expectTypeOf(server.id).toMatchTypeOf<string>()
  expectTypeOf(server.defaultMessage).toMatchTypeOf<string>()
})

test('FormattedMessage renders typed descriptors and rich callbacks', () => {
  expect(
    renderToStaticMarkup(
      <IntlProvider locale="en">
        <FormattedMessage {...message} values={{count: 2}} />
      </IntlProvider>
    )
  ).toBe('2')
  const rich = defineMessage<{b: MessageTag}>(
    {id: 'rich-hello', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  expect(
    renderToStaticMarkup(
      <IntlProvider locale="en">
        <FormattedMessage
          {...rich}
          values={{
            b: chunks => {
              expectTypeOf(chunks).toEqualTypeOf<React.ReactNode[]>()
              return <strong>{chunks}</strong>
            },
          }}
        />
      </IntlProvider>
    )
  ).toBe('<strong>Hello</strong>')
})

function checkTypedJSX() {
  const required = <FormattedMessage {...message} values={{count: 2}} />
  // @ts-expect-error Typed descriptors require their values.
  const missing = <FormattedMessage {...message} />
  // @ts-expect-error Values cannot widen the inferred ICU contract.
  const wrong = <FormattedMessage {...message} values={{count: 'two'}} />
  const plain = defineMessage<{}>({defaultMessage: 'Hello'}, {typed: true})
  const empty = <FormattedMessage {...plain} />
  // @ts-expect-error Argument-free messages reject extra values.
  const extra = <FormattedMessage {...plain} values={{extra: 1}} />
  const rich = defineMessage<{b: MessageTag}>(
    {id: 'rich-hello', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  // @ts-expect-error A rich tag requires a callback.
  const badTag = <FormattedMessage {...rich} values={{b: 'bold'}} />
  const legacy = (
    <FormattedMessage defaultMessage="{count}" values={{count: 'two'}} />
  )
  return [required, missing, wrong, empty, extra, badTag, legacy]
}
void checkTypedJSX

declare global {
  namespace FormatjsIntl {
    interface MessageArguments {
      'registered-count': {readonly count: number | bigint}
      'registered-empty': {}
      'registered-rich': {readonly b: MessageTag}
      'registered-optional': {readonly name?: string}
    }
  }
}

function checkRegisteredMessages() {
  const text: string = intl.formatMessage({id: 'registered-count'}, {count: 2})
  intl.$t({id: 'registered-count'}, {count: 2n})
  // @ts-expect-error Registered arguments are required.
  intl.formatMessage({id: 'registered-count'})
  // @ts-expect-error Registered numeric arguments reject strings.
  intl.formatMessage({id: 'registered-count'}, {count: 'two'})
  // @ts-expect-error The alias checks registered IDs too.
  intl.$t({id: 'registered-count'}, {count: 'two'})
  // @ts-expect-error Known IDs cannot fall through the legacy overload.
  intl.$t({id: 'registered-count'})
  intl.formatMessage({id: 'registered-empty'})
  // @ts-expect-error Empty contracts reject extra values.
  intl.formatMessage({id: 'registered-empty'}, {extra: 2})
  intl.formatMessage({id: 'registered-optional'})
  intl.formatMessage({id: 'registered-rich'}, {b: chunks => chunks.join('')})
  // @ts-expect-error Tags require callbacks.
  intl.formatMessage({id: 'registered-rich'}, {b: 'strong'})
  const known = {id: 'registered-count'} as const
  // @ts-expect-error Descriptor variables retain known ID checking.
  intl.formatMessage(known, {count: false})
  const dynamic: string = 'registered-count'
  intl.formatMessage({id: dynamic})
  intl.formatMessage({id: 'unregistered'}, {anything: 'allowed'})
  intl.formatMessage<{count: string}>(
    {id: 'registered-count'},
    {count: 'override'}
  )
  return text
}
void checkRegisteredMessages

test('registered contracts preserve runtime formatting', () => {
  const registered = createIntl({
    locale: 'en',
    messages: {'registered-count': '{count, number}'},
  })
  expect(registered.formatMessage({id: 'registered-count'}, {count: 3})).toBe(
    '3'
  )
  expect(registered.$t({id: 'registered-count'}, {count: 4})).toBe('4')
})

const catalogSource = {
  derived: {id: 'registered-derived', defaultMessage: '{count, number}'},
} as const
const derivedCatalog: {
  readonly derived: TypedMessageDescriptor<{readonly count: number}> &
    typeof catalogSource.derived
} = defineMessages<
  {readonly derived: {readonly count: number}},
  typeof catalogSource
>(catalogSource, {typed: true})
type DerivedRegistry = MessageArgumentsFromCatalog<typeof derivedCatalog>

declare global {
  namespace FormatjsIntl {
    interface MessageArguments extends DerivedRegistry {}
  }
}

function checkDerivedRegistry(id: 'registered-count' | 'registered-rich') {
  intl.$t({id: 'registered-derived'}, {count: 1})
  // @ts-expect-error Catalog-derived contracts check values.
  intl.$t({id: 'registered-derived'}, {count: 'one'})
  // @ts-expect-error A union ID requires both possible contracts.
  intl.$t({id}, {count: 1})
  intl.$t({id}, {count: 1, b: chunks => chunks.join('')})
  const optional: string = intl.formatMessage({id: 'registered-optional'})
  const empty: string = intl.formatMessage({id: 'registered-empty'})
  return [optional, empty]
}
void checkDerivedRegistry

function checkRegisteredReactOutput() {
  const output: React.ReactNode = intl.formatMessage(
    {id: 'registered-rich'},
    {b: chunks => <strong>{chunks}</strong>}
  )
  return output
}
void checkRegisteredReactOutput

test('text-only helpers accept core and React formatters', () => {
  const core = createCoreIntl({locale: 'en'})
  const formatters: TextMessageFormatter[] = [
    core.formatMessage,
    core.$t,
    intl.formatMessage,
    intl.$t,
  ]
  const rich = defineMessage<{b: MessageTag}>(
    {id: 'text-only-rich', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  for (const format of formatters) {
    expect(format(message, {count: 2})).toBe('2')
    expect(
      format(rich, {
        b: chunks => {
          expectTypeOf(chunks).toEqualTypeOf<string[]>()
          return chunks.join('').toUpperCase()
        },
      })
    ).toBe('HELLO')
    expectTypeOf(
      format({id: 'text-only-plain', defaultMessage: 'Plain text'})
    ).toEqualTypeOf<string>()
  }
})

function checkTextMessageFormatter(format: TextMessageFormatter) {
  format<{name: string}>({defaultMessage: 'Hello {name}'}, {name: 'Ada'})
  format({id: 'registered-count'}, {count: 2})
  // @ts-expect-error Typed descriptors retain required arguments.
  format(message)
  // @ts-expect-error Values cannot weaken the descriptor contract.
  format(message, {count: 'two'})
  // @ts-expect-error Explicit contracts retain required arguments.
  format<{name: string}>({defaultMessage: 'Hello {name}'})
  // @ts-expect-error Registered IDs cannot fall through to legacy formatting.
  format({id: 'registered-count'})
  // @ts-expect-error Registered arguments retain their types.
  format({id: 'registered-count'}, {count: 'two'})
  // @ts-expect-error Text helpers do not accept React elements.
  format({defaultMessage: '{name}'}, {name: <b>Ada</b>})
  // @ts-expect-error Text helpers do not accept callbacks returning React elements.
  format({id: 'registered-rich'}, {b: chunks => <b>{chunks}</b>})
}
void checkTextMessageFormatter

test('helper generics carry ICU contracts without an options flag', () => {
  const descriptor = defineMessage<{count: number}>({
    id: 'no-flag-count',
    defaultMessage: '{count, number}',
  })
  const catalog = defineMessages<{hello: {name: string}}>({
    hello: {id: 'no-flag-hello', defaultMessage: 'Hello {name}'},
  })
  expect(intl.$t(descriptor, {count: 2})).toBe('2')
  expect(intl.$t(catalog.hello, {name: 'Ada'})).toBe('Hello Ada')
  const invalid = () => {
    // @ts-expect-error Removing the options flag must retain required arguments.
    intl.$t(descriptor)
    // @ts-expect-error Catalog contracts still reject mismatched arguments.
    intl.$t(catalog.hello, {name: 2})
  }
  void invalid
})

test('catalogs preserve referenced contracts and computed enum keys', () => {
  enum Key {
    Count = 'count',
    Greeting = 'greeting',
  }
  const catalog = defineMessages<{
    readonly [Key.Count]: MessageValuesOf<typeof message>
    readonly [Key.Greeting]: {readonly name: MessageValue}
  }>({
    [Key.Count]: message,
    [Key.Greeting]: {id: 'catalog-greeting', defaultMessage: 'Hello {name}'},
  })
  expectTypeOf<ServerMessageValuesOf<typeof catalog.count>>().toEqualTypeOf<{
    count: number | bigint
  }>()
  expect(intl.formatMessage(catalog.count, {count: 2})).toBe('2')
  expect(intl.formatMessage(catalog.greeting, {name: 'Ada'})).toBe('Hello Ada')
  const check = () => {
    // @ts-expect-error Referencing a descriptor must preserve required values.
    intl.formatMessage(catalog.count)
    // @ts-expect-error Referencing a descriptor must preserve numeric arguments.
    intl.formatMessage(catalog.count, {count: 'two'})
  }
  void check
})

test('mixed catalogs infer callbacks from referenced rich-text messages', () => {
  const shared = defineMessages<{
    help: {b: MessageTag}
    tooMany: {count: number | bigint}
  }>({
    help: {id: 'upload-help', defaultMessage: '<b>Help</b>'},
    tooMany: {id: 'upload-count', defaultMessage: '{count, number} files'},
  })
  const catalog = defineMessages<{
    Denied: {}
    TooMany: MessageValuesOf<typeof shared.tooMany>
    Help: MessageValuesOf<typeof shared.help>
  }>({
    Denied: {id: 'upload-denied', defaultMessage: 'Access denied'},
    TooMany: shared.tooMany,
    Help: shared.help,
  })
  const rich = intl.$t(catalog.Help, {
    b: chunks => {
      expectTypeOf(chunks).toEqualTypeOf<React.ReactNode[]>()
      return <b>{chunks}</b>
    },
  })
  expect(renderToStaticMarkup(<>{rich}</>)).toBe('<b>Help</b>')
  expectTypeOf(intl.$t(catalog.Denied)).toEqualTypeOf<string>()
  expect(intl.$t(catalog.TooMany, {count: 2})).toBe('2 files')
  const invalid = () => {
    // @ts-expect-error Referenced rich messages still require their tag callback.
    intl.$t(catalog.Help)
    // @ts-expect-error Numeric values must not become untyped through the catalog.
    intl.$t(catalog.TooMany, {count: 'two'})
  }
  void invalid
})

function checkMixedEmptyDescriptors(
  legacy: MessageDescriptor,
  useTyped: boolean
) {
  const empty = defineMessage<{}>({defaultMessage: 'Fallback'})
  const selected = useTyped ? empty : legacy
  expectTypeOf(intl.formatMessage(selected)).toEqualTypeOf<string>()
  expectTypeOf(intl.$t(selected)).toEqualTypeOf<string>()
  const rendered = <FormattedMessage {...selected} />
  // @ts-expect-error A mixed selection must not hide a required argument.
  intl.formatMessage(useTyped ? message : legacy)
  // @ts-expect-error JSX must retain required arguments in mixed selections.
  const missing = <FormattedMessage {...(useTyped ? message : legacy)} />
  // @ts-expect-error Empty typed messages do not accept arbitrary values.
  const extra = <FormattedMessage {...empty} values={{unexpected: 1}} />
  // @ts-expect-error A typed-empty branch cannot receive arbitrary legacy values.
  const mixedExtra = <FormattedMessage {...selected} values={{unexpected: 1}} />
  // @ts-expect-error Explicit empty ICU contracts still validate descriptors.
  intl.formatMessage<{}>({defaultMessage: 1})
  const registered = {id: 'registered-count'} as const
  // @ts-expect-error A mixed registered ID must retain its required values.
  intl.$t(useTyped ? empty : registered)
  return [rendered, missing, extra, mixedExtra]
}
void checkMixedEmptyDescriptors
