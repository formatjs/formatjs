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
  V extends MessageValues = never,
  const D extends MessageDescriptor = never,
>(
  message: [NoInfer<V>] extends [never] ? never : D,
  options?: {typed: true}
): Readonly<D> & Omit<TypedMessageDescriptor<NoInfer<V>>, keyof D>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never]
    ? never
    : MessageDescriptor & {
        id: NonNullable<MessageDescriptor['id']>
        defaultMessage: string
      },
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>> &
  Readonly<{id: NonNullable<MessageDescriptor['id']>; defaultMessage: string}>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never]
    ? never
    : MessageDescriptor & {
        id: NonNullable<MessageDescriptor['id']>
        defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
      },
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>> &
  Readonly<{
    id: NonNullable<MessageDescriptor['id']>
    defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
  }>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never]
    ? never
    : MessageDescriptor & {defaultMessage: string},
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>> & Readonly<{defaultMessage: string}>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never]
    ? never
    : MessageDescriptor & {
        defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
      },
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>> &
  Readonly<{defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>}>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never]
    ? never
    : MessageDescriptor & {id: NonNullable<MessageDescriptor['id']>},
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>> &
  Readonly<{id: NonNullable<MessageDescriptor['id']>}>
export function defineMessage<V extends MessageValues = never>(
  message: [NoInfer<V>] extends [never] ? never : MessageDescriptor,
  options?: {typed: true}
): TypedMessageDescriptor<NoInfer<V>>
export function defineMessage<T>(message: T): Readonly<T>
export function defineMessage(
  message: unknown,
  _options?: {typed: true}
): unknown {
  return message
}

export function defineMessages<
  V extends Record<string, MessageValues> = never,
  const D extends {[K in keyof NoInfer<V>]: MessageDescriptor} = never,
>(
  messages: [NoInfer<V>] extends [never] ? never : D,
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: Readonly<D[K]> &
    Omit<TypedMessageDescriptor<NoInfer<V[K]>>, keyof D[K]>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {
        [K in keyof NoInfer<V>]: MessageDescriptor & {
          id: NonNullable<MessageDescriptor['id']>
          defaultMessage: string
        }
      },
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>> &
    Readonly<{id: NonNullable<MessageDescriptor['id']>; defaultMessage: string}>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {
        [K in keyof NoInfer<V>]: MessageDescriptor & {
          id: NonNullable<MessageDescriptor['id']>
          defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
        }
      },
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>> &
    Readonly<{
      id: NonNullable<MessageDescriptor['id']>
      defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
    }>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {[K in keyof NoInfer<V>]: MessageDescriptor & {defaultMessage: string}},
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>> &
    Readonly<{defaultMessage: string}>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {
        [K in keyof NoInfer<V>]: MessageDescriptor & {
          defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>
        }
      },
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>> &
    Readonly<{defaultMessage: NonNullable<MessageDescriptor['defaultMessage']>}>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {
        [K in keyof NoInfer<V>]: MessageDescriptor & {
          id: NonNullable<MessageDescriptor['id']>
        }
      },
  options?: {typed: true}
): {
  readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>> &
    Readonly<{id: NonNullable<MessageDescriptor['id']>}>
}
export function defineMessages<V extends Record<string, MessageValues> = never>(
  messages: [NoInfer<V>] extends [never]
    ? never
    : {[K in keyof NoInfer<V>]: MessageDescriptor},
  options?: {typed: true}
): {readonly [K in keyof NoInfer<V>]: TypedMessageDescriptor<NoInfer<V[K]>>}
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
