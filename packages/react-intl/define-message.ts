import type {
  MessageDescriptor,
  MessageValues,
  TypedMessageDescriptor,
} from '@formatjs/intl'

export function defineMessage<V extends MessageValues>(
  message: MessageDescriptor,
  options: {typed: true}
): TypedMessageDescriptor<V>
export function defineMessage<T extends MessageDescriptor>(message: T): T
export function defineMessage(
  message: MessageDescriptor,
  _options?: {typed: true}
): MessageDescriptor {
  return message
}
