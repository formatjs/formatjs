import {MessageDescriptor} from './src/types.js'
export * from './src/types.js'

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(msgs: U): U {
  return msgs
}

export function defineMessage<T>(msg: T): T {
  return msg
}

export {
  createIntlCache,
  filterProps,
  DEFAULT_INTL_CONFIG,
  createFormatters,
  getNamedFormat,
} from './src/utils.js'
export * from './src/error.js'
export {formatMessage} from './src/message.js'
export type {FormatMessageFn} from './src/message.js'
export {
  formatDate,
  formatDateToParts,
  formatTime,
  formatTimeToParts,
} from './src/dateTime.js'
export {formatDisplayName} from './src/displayName.js'
export {formatList} from './src/list.js'
export {formatPlural} from './src/plural.js'
export {formatRelativeTime} from './src/relativeTime.js'
export {formatNumber, formatNumberToParts} from './src/number.js'
export {createIntl} from './src/create-intl.js'
export type {CreateIntlFn} from './src/create-intl.js'
