import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd'
import {
  createIntl,
  defineMessage,
  type FormattedText,
  type MessageTextOutput,
  type MessageTag,
  type TextMessageFormatter,
  type FormatMessageFn,
} from '..'
import {
  IntlMessageFormat,
  type FormattedText as LowLevelFormattedText,
} from 'intl-messageformat'

declare global {
  namespace FormatjsIntl {
    interface MessageArguments {
      'items.count': {count: number}
      'rich.tag': {b: MessageTag}
    }
  }
}

const intl = createIntl({locale: 'en'})
const descriptor = defineMessage<{count: number}>(
  {id: 'count', defaultMessage: '{count, number}'},
  {typed: true}
)
const explicitDescriptor = {id: 'explicit', defaultMessage: '{count, number}'}
const registeredDescriptor = {id: 'items.count'} as const
const plainDescriptor = {id: 'plain', defaultMessage: 'Hello {name}'}
const taggedDescriptor = defineMessage<{b: MessageTag}>(
  {id: 'tagged', defaultMessage: '<b>Hello</b>'},
  {typed: true}
)

expectType<LowLevelFormattedText>(null as unknown as FormattedText)
expectType<FormattedText>(null as unknown as LowLevelFormattedText)
expectNotAssignable<FormattedText>('plain text')

for (const format of [intl.formatMessage, intl.$t]) {
  expectType<string>(format(descriptor, {count: 2}))
  expectType<string>(format<{count: number}>(explicitDescriptor, {count: 2}))
  expectType<string>(format(registeredDescriptor, {count: 2}))
  expectType<string>(format(plainDescriptor, {name: 'Ada'}))
  expectType<string>(format({id: 'missing'}))
  expectType<string>(format(taggedDescriptor, {b: chunks => chunks.join('')}))
  expectType<string>(format(defineMessage({id: 'empty'}, {typed: true})))
  expectError(format(descriptor))
  expectError(format(descriptor, {count: 'two'}))
  expectError(format<{count: number}>(explicitDescriptor))
  expectError(format<{count: number}>(explicitDescriptor, {count: 'two'}))
  expectError(format(registeredDescriptor))
  expectError(format(registeredDescriptor, {count: 'two'}))
  const textOnly: TextMessageFormatter = format
  expectType<string>(textOnly(descriptor, {count: 2}))
  expectType<string>(textOnly<{count: number}>(explicitDescriptor, {count: 2}))
  expectType<string>(textOnly(registeredDescriptor, {count: 2}))
  expectType<string>(textOnly(plainDescriptor, {name: 'Ada'}))
  expectError(textOnly(descriptor))
  expectError(textOnly(registeredDescriptor, {count: 'two'}))
}
expectType<string>(null as unknown as MessageTextOutput)
expectAssignable<string>(intl.formatMessage(descriptor, {count: 2}))
expectType<string>(intl.formatNumber(2))
expectType<string>(intl.formatDate(0))

const richIntl = createIntl<{element: true}>({locale: 'en'})
const richOutput = {element: true} as const
expectType<string | {element: true} | Array<string | {element: true}>>(
  richIntl.formatMessage(taggedDescriptor, {b: () => richOutput})
)
expectType<string | {element: true} | Array<string | {element: true}>>(
  richIntl.$t<{b: MessageTag}, {element: true}>(explicitDescriptor, {
    b: () => richOutput,
  })
)
expectNotAssignable<FormattedText>(
  richIntl.formatMessage(taggedDescriptor, {b: () => richOutput})
)

let label = intl.formatMessage(descriptor, {count: 2})
expectType<string>(label)
label = 'Loading'
expectType<string>(label)
expectNotAssignable<FormattedText>(intl.formatMessage(descriptor, {count: 2}))
expectAssignable<TextMessageFormatter>(() => 'mock')

// Low-level formatting keeps its existing output types even with opt-in.
expectType<string>(null as unknown as ReturnType<FormatMessageFn<string>>)
const lowLevelOutput = new IntlMessageFormat<{}>('Hello').format()
expectType<string | string[]>(lowLevelOutput)

expectType<string | {element: true} | Array<string | {element: true}>>(
  richIntl.formatMessage({id: 'rich.tag'}, {b: () => richOutput})
)
