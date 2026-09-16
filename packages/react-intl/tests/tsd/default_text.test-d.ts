import {createElement, type ReactNode} from 'react'
import {
  createIntl as createServerIntl,
  type FormattedText as ServerText,
} from '../server'
import {
  createIntl as createCoreIntl,
  type FormattedText as CoreText,
} from '@formatjs/intl'
import {useIntl as useVueIntl, type FormattedText as VueText} from 'vue-intl'
import {
  useIntl as useSvelteIntl,
  type FormattedText as SvelteText,
} from '@formatjs/svelte-intl'
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
} from '..'
import type {FormattedText as LowLevelFormattedText} from 'intl-messageformat'

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

expectType<FormattedText>(null as unknown as ServerText)
expectType<FormattedText>(null as unknown as CoreText)
expectType<FormattedText>(null as unknown as VueText)
expectType<FormattedText>(null as unknown as SvelteText)
const serverIntl = createServerIntl({locale: 'en'})
expectType<string>(serverIntl.formatMessage(descriptor, {count: 2}))
expectType<string>(serverIntl.$t(registeredDescriptor, {count: 2}))
const coreIntl = createCoreIntl({locale: 'en'})
expectType<string>(coreIntl.formatMessage(descriptor, {count: 2}))
expectType<string>(coreIntl.$t(registeredDescriptor, {count: 2}))
const vueIntl = useVueIntl()
expectType<string>(vueIntl.formatMessage(descriptor, {count: 2}))
expectType<string>(vueIntl.$t(registeredDescriptor, {count: 2}))
const svelteIntl = useSvelteIntl()
expectType<string>(svelteIntl.formatMessage(descriptor, {count: 2}))
expectType<string>(svelteIntl.$t(registeredDescriptor, {count: 2}))

expectType<ReactNode>(
  intl.formatMessage(taggedDescriptor, {
    b: chunks => createElement('b', null, chunks),
  })
)
expectNotAssignable<FormattedText>(
  intl.formatMessage(taggedDescriptor, {
    b: chunks => createElement('b', null, chunks),
  })
)
const textOnly: TextMessageFormatter = intl.formatMessage
expectError(
  textOnly(taggedDescriptor, {b: chunks => createElement('b', null, chunks)})
)

let label = intl.formatMessage(descriptor, {count: 2})
label = 'Loading'
expectType<string>(label)
expectNotAssignable<FormattedText>(intl.formatMessage(descriptor, {count: 2}))
expectAssignable<TextMessageFormatter>(() => 'mock')

expectType<ReactNode | ReactNode[]>(
  intl.$t<{b: MessageTag}, ReactNode>(
    {id: 'explicit.rich'},
    {b: chunks => createElement('b', null, chunks)}
  )
)
expectType<ReactNode | ReactNode[]>(
  intl.$t({id: 'rich.tag'}, {b: chunks => createElement('b', null, chunks)})
)
