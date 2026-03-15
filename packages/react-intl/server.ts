import {type MessageDescriptor} from '@formatjs/intl'

export {
  createIntlCache,
  type IntlCache,
  type MessageDescriptor,
} from '@formatjs/intl'
export {createIntl} from './src/components/createIntl.js'
export type {IntlConfig, IntlShape, ResolvedIntlConfig} from './src/types.js'

// Identity functions — duplicated here to avoid importing from "use client" index
export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(msgs: U): U {
  return msgs
}

export function defineMessage<T extends MessageDescriptor>(msg: T): T {
  return msg
}
