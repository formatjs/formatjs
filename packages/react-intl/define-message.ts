import type {
  MessageDescriptor,
  MessageValues,
  TypedMessageDescriptor,
} from '@formatjs/intl'

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
export function defineMessage<T extends MessageDescriptor>(
  message: T
): Readonly<T>
export function defineMessage(
  message: MessageDescriptor,
  _options?: {typed: true}
): MessageDescriptor {
  return message
}
