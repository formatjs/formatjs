import type {MessageDescriptor} from '#packages/intl/types.js'
import {expect, expectTypeOf, test} from 'vitest'
import {
  createIntl,
  defineMessage,
  defineMessages,
  type MessageTag,
  type MessageArgumentsFromCatalog,
  type TypedMessageDescriptor,
  type MessageValue,
} from '#packages/intl/index.js'

const intl = createIntl({locale: 'en'})
const message = defineMessage<{count: number | bigint}>(
  {
    id: 'count',
    defaultMessage: '{count, plural, one {# item} other {# items}}',
  },
  {typed: true}
)

test('typed descriptors remain ordinary descriptors at runtime', () => {
  expect(Object.keys(message)).toEqual(['id', 'defaultMessage'])
  expect(intl.formatMessage(message, {count: 2})).toBe('2 items')
  expect(intl.$t(message, {count: 1n})).toBe('1 item')
  const tag = defineMessage<{b: MessageTag; name: MessageValue}>(
    {id: 'rich', defaultMessage: '<b>{name}</b>'},
    {typed: true}
  )
  expect(
    intl.formatMessage(tag, {
      b: chunks => chunks.join('').toUpperCase(),
      name: 'hello',
    })
  ).toBe('HELLO')
  const catalog = defineMessages<{hello: {}; total: {n: number | bigint}}>(
    {
      hello: {id: 'hello', defaultMessage: 'Hello'},
      total: {id: 'total', defaultMessage: '{n, number}'},
    },
    {typed: true}
  )
  expect(intl.formatMessage(catalog.hello)).toBe('Hello')
  expect(intl.formatMessage(catalog.total, {n: 12})).toBe('12')
})

// Compiled by the Bazel test typecheck, never executed.
type OriginalDefineMessage = <T>(message: T) => Readonly<T>
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

  intl.formatMessage<{n: number}>({defaultMessage: '{n}'}, {n: 1})
  intl.$t<{n: number}>({defaultMessage: '{n}'}, {n: 1})
  // @ts-expect-error Explicit contracts require values.
  intl.formatMessage<{n: number}>({defaultMessage: '{n}'})
  // @ts-expect-error Explicit contracts check value types.
  intl.formatMessage<{n: number}>({defaultMessage: '{n}'}, {n: 'one'})
  // @ts-expect-error Alias uses the same argument contract.
  intl.$t<{n: number}>({defaultMessage: '{n}'}, {n: 'one'})
  intl.formatMessage<{}>({defaultMessage: 'Hello'})
  // @ts-expect-error Plain descriptors retain validation.
  intl.formatMessage<{}>({defaultMessage: 1})
  // @ts-expect-error First generic no longer describes rich output.
  intl.$t<string>({defaultMessage: 'Hello'})

  expectTypeOf<Parameters<typeof defineMessage>>().toEqualTypeOf<
    Parameters<OriginalDefineMessage>
  >()
  expectTypeOf<ReturnType<typeof defineMessage>>().toEqualTypeOf<
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
  const wrappedMessage = (...args: Parameters<typeof defineMessage>) =>
    defineMessage(...args)
  const defineCatalog = defineMessages<
    'hello',
    MessageDescriptor,
    Record<'hello', MessageDescriptor>
  >
  const wrappedMessages = (...args: Parameters<typeof defineCatalog>) =>
    defineCatalog(...args)
  wrappedMessage({id: 'wrapped'})
  wrappedMessages({hello: {id: 'wrapped'}})

  expectTypeOf(intl.formatMessage(message, {count: 1})).toEqualTypeOf<string>()
  // @ts-expect-error Typed descriptors cannot use the permissive overload.
  intl.formatMessage(message)
  // @ts-expect-error Missing count.
  intl.formatMessage(message, {})
  // @ts-expect-error Numeric placeholders reject strings.
  intl.formatMessage(message, {count: '2'})
  // @ts-expect-error The alias checks the same contract.
  intl.$t(message, {count: false})
  const wrongValues = {count: 'two'}
  // @ts-expect-error Reused value maps cannot infer a weaker contract.
  intl.formatMessage(message, wrongValues)
  const format = intl.formatMessage
  // @ts-expect-error Detached formatter retains the contract.
  format(message, wrongValues)
  // @ts-expect-error Fresh object literals reject unused values.
  intl.formatMessage(message, {count: 2, extra: true})
  const named = defineMessage<{name: MessageValue}>(
    {id: 'named', defaultMessage: '{name}'},
    {typed: true}
  )
  const selected = Math.random() ? message : named
  // @ts-expect-error Union descriptors still require values.
  intl.formatMessage(selected)
  // @ts-expect-error Values must cover every possible descriptor.
  intl.formatMessage(selected, {count: 2})
  intl.formatMessage(selected, {count: 2, name: 'Ada'})
  const empty = defineMessage<{}>(
    {id: 'empty', defaultMessage: 'Hello'},
    {typed: true}
  )
  // @ts-expect-error A message without placeholders accepts no values.
  intl.formatMessage(empty, {extra: 2})
  const date = defineMessage<{now: number | Date}>(
    {id: 'date', defaultMessage: '{now, date}'},
    {typed: true}
  )
  intl.formatMessage(date, {now: new Date()})
  // @ts-expect-error Dates do not accept strings.
  intl.formatMessage(date, {now: 'today'})
  const tag = defineMessage<{b: MessageTag}>(
    {id: 'rich', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  const richIntl = createIntl<{children: unknown[]}>({locale: 'en'})
  richIntl.formatMessage(tag, {b: chunks => ({children: chunks})})
  richIntl.$t(tag, {b: chunks => ({children: chunks})})
  // @ts-expect-error Tags require callbacks.
  intl.formatMessage(tag, {b: 'bold'})
  const legacy = defineMessage<{anything: MessageValue}>({
    id: 'legacy' as const,
    defaultMessage: '{anything}',
  })
  expectTypeOf(legacy.id).toEqualTypeOf<string>()
  // @ts-expect-error Nonempty helper contracts require values.
  intl.formatMessage(legacy)
  intl.formatMessage(legacy, {anything: 'still permissive'})
}
void checkTypes

test('readonly helpers preserve runtime identity', () => {
  const descriptor = {id: 'identity', defaultMessage: 'Hello'}
  expect(defineMessage(descriptor)).toBe(descriptor)
  const catalog = {hello: descriptor}
  expect(defineMessages(catalog)).toBe(catalog)
  expect(Object.isFrozen(descriptor)).toBe(false)
})

function checkReadonlyHelpers() {
  const plain = defineMessage({id: 'plain'})
  // @ts-expect-error Helper descriptor fields are readonly.
  plain.id = 'changed'
  // @ts-expect-error Typed descriptors are readonly too.
  message.id = 'changed'
  const catalog = defineMessages({plain: {id: 'plain'}})
  // @ts-expect-error Catalog entries are readonly.
  catalog.plain = {id: 'changed'}
  // @ts-expect-error Catalog descriptors are readonly.
  catalog.plain.id = 'changed'
}
void checkReadonlyHelpers

test('typed helpers retain required metadata', () => {
  const both = defineMessage<{n: number}>(
    {id: 'metadata', defaultMessage: '{n, number}'},
    {typed: true}
  )
  const id: string = both.id
  const text: string = both.defaultMessage
  expect(id).toBe('metadata')
  expect(text).toBe('{n, number}')
  const idOnly = defineMessage<{}>({id: 'id-only'}, {typed: true})
  expectTypeOf(idOnly.id).toMatchTypeOf<string>()
  const textOnly = defineMessage<{}>({defaultMessage: 'Hello'}, {typed: true})
  expectTypeOf(textOnly.defaultMessage).toMatchTypeOf<string>()
  const catalog = defineMessages<{hello: {}}>(
    {hello: {id: 'hello', defaultMessage: 'Hello'}},
    {typed: true}
  )
  expectTypeOf(catalog.hello.id).toMatchTypeOf<string>()
  expectTypeOf(catalog.hello.defaultMessage).toMatchTypeOf<string>()
  const source = {
    id: 'literal',
    defaultMessage: 'Hello',
    description: 'Context',
  } as const
  const exact = defineMessage<{}, typeof source>(source, {typed: true})
  expectTypeOf(exact.id).toEqualTypeOf<'literal'>()
  expectTypeOf(exact.description).toEqualTypeOf<'Context'>()
  const mixed = {
    withId: {id: 'one'},
    withText: {defaultMessage: 'Two'},
  } as const
  const exactCatalog = defineMessages<{withId: {}; withText: {}}, typeof mixed>(
    mixed,
    {typed: true}
  )
  expectTypeOf(exactCatalog.withId.id).toEqualTypeOf<'one'>()
  expectTypeOf(exactCatalog.withText.defaultMessage).toEqualTypeOf<'Two'>()
})

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

// Compiled with the test target: empty defaults must not erase the contract.
function checkDefaultEmptyContracts() {
  const plain = defineMessage({id: 'empty-default', defaultMessage: 'Hello'})
  const annotated: TypedMessageDescriptor = plain
  const catalog = defineMessages({hello: {defaultMessage: 'Hello'}})
  const withOption = defineMessages(
    {hello: {defaultMessage: 'Hello'}},
    {typed: true}
  )
  // @ts-expect-error Legacy options do not weaken the default empty contract.
  intl.$t(withOption.hello, {extra: 1})
  expectTypeOf(intl.$t(plain)).toEqualTypeOf<string>()
  expectTypeOf(intl.formatMessage(annotated)).toEqualTypeOf<string>()
  expectTypeOf(intl.$t(catalog.hello)).toEqualTypeOf<string>()
  // @ts-expect-error No arguments are allowed by the default empty contract.
  intl.$t(plain, {extra: 1})
  // @ts-expect-error An annotation without generics preserves the empty contract.
  intl.formatMessage(annotated, {extra: 1})
  // @ts-expect-error Inferred catalogs preserve each empty contract.
  intl.$t(catalog.hello, {extra: 1})
  const named = defineMessage<{name: MessageValue}>({defaultMessage: '{name}'})
  const mixed = defineMessages({plain, named})
  // @ts-expect-error Reusing a typed descriptor must not replace its contract with {}.
  intl.$t(mixed.named)
  expectTypeOf(intl.$t(mixed.named, {name: 'Ada'})).toEqualTypeOf<string>()
  expectTypeOf(intl.$t(mixed.plain)).toEqualTypeOf<string>()
}
void checkDefaultEmptyContracts
