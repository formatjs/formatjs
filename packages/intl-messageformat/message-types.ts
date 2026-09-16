import type {
  FormatXMLElementFn,
  PrimitiveType,
  MessageFormatPart,
} from '#packages/intl-messageformat/formatters.js'

declare const formattedTextBrand: unique symbol

/** Formatter-produced text, including fallbacks; not a translation or safety guarantee. */
export type FormattedText = string & {
  readonly [formattedTextBrand]: true
}

declare const messageValues: unique symbol
declare const messageTag: unique symbol

/** An unformatted ICU argument, before framework-specific rich values are added. */
export type MessageValue = PrimitiveType

/** A tag placeholder whose callback type is supplied by the formatter. */
export interface MessageTag {
  readonly [messageTag]: true
}

export type MessageValues = Record<string, MessageValue | MessageTag>

/** Type-only argument metadata shared by formatter integrations. */
export interface MessageContract<V extends MessageValues> {
  readonly [messageValues]: V
}

export type MessageValuesOf<D extends MessageContract<MessageValues>> =
  D[typeof messageValues]

export interface UntypedMessageContract {
  readonly [messageValues]?: never
}

type ResolveMessageValues<V extends MessageValues, T, TChunk> = {
  [K in keyof V]: [V[K]] extends [undefined]
    ? V[K]
    : Exclude<V[K], undefined> extends MessageTag
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

export type MessageFormatArguments<
  V extends MessageValues,
  T = string,
  TChunk = T,
  Extra extends unknown[] = [],
> =
  MessageKeys<V> extends never
    ? [values?: Record<string, never>, ...extra: Extra]
    : {} extends TypedMessageValues<V, T, TChunk>
      ? [values?: TypedMessageValues<V, T, TChunk>, ...extra: Extra]
      : [values: TypedMessageValues<V, T, TChunk>, ...extra: Extra]

export type UntypedMessageFormat = <T = void>(
  values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>
) => string | T | (string | T)[]

export type UntypedMessageFormatToParts = <T>(
  values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>
) => MessageFormatPart<T>[]

export type MessageFormatFunction<V extends MessageValues | undefined> = [
  V,
] extends [MessageValues]
  ? <T = string>(
      ...args: MessageFormatArguments<Extract<V, MessageValues>, T>
    ) => string | T | (string | T)[]
  : UntypedMessageFormat

export type MessageFormatToPartsFunction<V extends MessageValues | undefined> =
  [V] extends [MessageValues]
    ? <T = string>(
        ...args: MessageFormatArguments<Extract<V, MessageValues>, T>
      ) => MessageFormatPart<T>[]
    : UntypedMessageFormatToParts
