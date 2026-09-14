import type {MessageDescriptor} from '@formatjs/intl'
import * as React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect, expectTypeOf, test} from 'vitest'
import type {defineMessages} from '#packages/react-intl/index.js'
import {
  createIntl,
  FormattedMessage,
  IntlProvider,
  defineMessage,
  type MessageTag,
  type MessageValue,
} from '#packages/react-intl/index.js'
import {
  defineMessage as serverMessage,
  createIntl as serverIntl,
} from '#packages/react-intl/server.js'

const intl = createIntl({locale: 'en'})
const message = defineMessage<{count: number | bigint}>(
  {id: 'items', defaultMessage: '{count, number}'},
  {typed: true}
)

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
          values={{b: chunks => <strong>{chunks}</strong>}}
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
