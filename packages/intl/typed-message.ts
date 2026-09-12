import type {
  FormatXMLElementFn,
  Options,
  PrimitiveType,
} from 'intl-messageformat'
import type {MessageDescriptor} from '#packages/intl/types.js'

declare const messageValues: unique symbol
declare const messageTag: unique symbol

/** An unformatted ICU argument, before framework-specific rich values are added. */
export type MessageValue = PrimitiveType

/** A tag placeholder whose callback type is supplied by the formatter. */
export interface MessageTag {
  readonly [messageTag]: true
}

export type MessageValues = Record<string, MessageValue | MessageTag>

/** Type-only metadata. The descriptor remains an ordinary object at runtime. */
export type TypedMessageDescriptor<V extends MessageValues> =
  MessageDescriptor & {
    readonly [messageValues]: V
  }

export type MessageValuesOf<D extends TypedMessageDescriptor<MessageValues>> =
  D[typeof messageValues]

export type UntypedMessageDescriptor = MessageDescriptor & {
  readonly [messageValues]?: never
}

type ResolveMessageValues<V extends MessageValues, T, TChunk> = {
  [K in keyof V]: V[K] extends MessageTag
    ? FormatXMLElementFn<string | TChunk, string | T | Array<string | T>>
    : MessageValue extends V[K]
      ? V[K] | T
      : Extract<V[K], MessageValue>
}

type MessageKeys<V> = V extends unknown ? keyof V : never

// A dynamically selected descriptor needs values valid for every possibility.
export type TypedMessageValues<
  V extends MessageValues,
  T = string,
  TChunk = T,
> = (
  V extends unknown
    ? (values: ResolveMessageValues<V, T, TChunk>) => void
    : never
) extends (values: infer Values) => void
  ? Values
  : never

export type TypedMessageArguments<
  V extends MessageValues,
  T = string,
  TChunk = T,
> =
  MessageKeys<V> extends never
    ? [values?: Record<string, never>, options?: Options]
    : [values: TypedMessageValues<V, T, TChunk>, options?: Options]

export function defineMessage<T>(message: T): T
export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor,
  options: {typed: true}
): TypedMessageDescriptor<V>
export function defineMessage(
  message: unknown,
  _options?: {typed: true}
): unknown {
  return message
}

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(messages: U): U
export function defineMessages<V extends Record<string, MessageValues>>(
  messages: {[K in keyof V]: MessageDescriptor},
  options: {typed: true}
): {[K in keyof V]: TypedMessageDescriptor<V[K]>}
export function defineMessages(
  messages: unknown,
  _options?: {typed: true}
): unknown {
  return messages
}
