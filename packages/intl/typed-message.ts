import type {
  MessageContract,
  MessageValues,
  MessageFormatArguments,
  UntypedMessageContract,
  Options,
} from 'intl-messageformat'
import type {MessageDescriptor} from '#packages/intl/types.js'
export type {
  MessageValue,
  MessageTag,
  MessageValues,
  MessageValuesOf,
  TypedMessageValues,
} from 'intl-messageformat'

export type TypedMessageDescriptor<V extends MessageValues> =
  Readonly<MessageDescriptor> & MessageContract<V>
export type UntypedMessageDescriptor = MessageDescriptor &
  UntypedMessageContract

export type TypedMessageArguments<
  V extends MessageValues,
  T = string,
  TChunk = T,
> = MessageFormatArguments<V, T, TChunk, [options?: Options]>

export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor,
  options: {typed: true}
): TypedMessageDescriptor<V>
export function defineMessage<T>(message: T): Readonly<T>
export function defineMessage(
  message: unknown,
  _options?: {typed: true}
): unknown {
  return message
}

export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {[K in keyof V]: MessageDescriptor},
  options: {typed: true}
): {readonly [K in keyof V]: TypedMessageDescriptor<V[K]>}
export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(messages: U): {readonly [P in keyof U]: Readonly<U[P]>}
export function defineMessages(
  messages: unknown,
  _options?: {typed: true}
): unknown {
  return messages
}
