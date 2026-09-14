import type {
  MessageContract,
  MessageValuesOf,
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

export function defineMessage<
  V extends MessageValues,
  const D extends MessageDescriptor,
>(
  message: D,
  options: {typed: true}
): Readonly<D> & Omit<TypedMessageDescriptor<V>, keyof D>
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor & {
    id: NonNullable<MessageDescriptor['id']>
    defaultMessage: string
  },
  options: {typed: true}
): TypedMessageDescriptor<V> &
  Readonly<{id: NonNullable<MessageDescriptor['id']>; defaultMessage: string}>
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor & {
    id: NonNullable<MessageDescriptor['id']>
    defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
  },
  options: {typed: true}
): TypedMessageDescriptor<V> &
  Readonly<{
    id: NonNullable<MessageDescriptor['id']>
    defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
  }>
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor & {defaultMessage: string},
  options: {typed: true}
): TypedMessageDescriptor<V> & Readonly<{defaultMessage: string}>
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor & {
    defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
  },
  options: {typed: true}
): TypedMessageDescriptor<V> &
  Readonly<{defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>}>
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor & {id: NonNullable<MessageDescriptor['id']>},
  options: {typed: true}
): TypedMessageDescriptor<V> &
  Readonly<{id: NonNullable<MessageDescriptor['id']>}>
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

export function defineMessages<
  V extends Record<string, MessageValues>,
  const D extends {[K in keyof V]: MessageDescriptor},
>(
  messages: D,
  options: {typed: true}
): {
  readonly [K in keyof V]: Readonly<D[K]> &
    Omit<TypedMessageDescriptor<V[K]>, keyof D[K]>
}
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {
    [K in keyof V]: MessageDescriptor & {
      id: NonNullable<MessageDescriptor['id']>
      defaultMessage: string
    }
  },
  options: {typed: true}
): {
  readonly [K in keyof V]: TypedMessageDescriptor<V[K]> &
    Readonly<{id: NonNullable<MessageDescriptor['id']>; defaultMessage: string}>
}
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {
    [K in keyof V]: MessageDescriptor & {
      id: NonNullable<MessageDescriptor['id']>
      defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
    }
  },
  options: {typed: true}
): {
  readonly [K in keyof V]: TypedMessageDescriptor<V[K]> &
    Readonly<{
      id: NonNullable<MessageDescriptor['id']>
      defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
    }>
}
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {[K in keyof V]: MessageDescriptor & {defaultMessage: string}},
  options: {typed: true}
): {
  readonly [K in keyof V]: TypedMessageDescriptor<V[K]> &
    Readonly<{defaultMessage: string}>
}
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {
    [K in keyof V]: MessageDescriptor & {
      defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
    }
  },
  options: {typed: true}
): {
  readonly [K in keyof V]: TypedMessageDescriptor<V[K]> &
    Readonly<{defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>}>
}
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {
    [K in keyof V]: MessageDescriptor & {
      id: NonNullable<MessageDescriptor['id']>
    }
  },
  options: {typed: true}
): {
  readonly [K in keyof V]: TypedMessageDescriptor<V[K]> &
    Readonly<{id: NonNullable<MessageDescriptor['id']>}>
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

/** Argument contracts keyed by application message IDs. */
export type RegisteredMessageId = keyof FormatjsIntl.MessageArguments & string

export type RegisteredMessageValues<K extends RegisteredMessageId> =
  FormatjsIntl.MessageArguments[K] extends MessageValues
    ? FormatjsIntl.MessageArguments[K]
    : never

/** Keep known IDs out of the permissive overload without rejecting dynamic IDs. */
export type UnregisteredMessageDescriptor<D extends UntypedMessageDescriptor> =
  D &
    (D extends {id: infer K}
      ? Extract<K, RegisteredMessageId> extends never
        ? unknown
        : never
      : unknown)

/** Derive a registry from typed catalog entries with literal IDs. */
export type MessageArgumentsFromCatalog<
  C extends Record<string, TypedMessageDescriptor<MessageValues>>,
> = {
  readonly [
    K in keyof C as C[K] extends {id: infer I extends string}
      ? string extends I
        ? never
        : I
      : never
  ]: MessageValuesOf<C[K]>
}
