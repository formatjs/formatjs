import {type MessageDescriptor} from '#packages/intl/src/types.js'
export * from '#packages/intl/src/types.js'

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
} from '#packages/intl/src/utils.js'
export * from '#packages/intl/src/error.js'
export {formatMessage} from '#packages/intl/src/message.js'
export type {FormatMessageFn} from '#packages/intl/src/message.js'
export {
  formatDate,
  formatDateToParts,
  formatTime,
  formatTimeToParts,
} from '#packages/intl/src/dateTime.js'
export {formatDisplayName} from '#packages/intl/src/displayName.js'
export {formatList} from '#packages/intl/src/list.js'
export {formatPlural} from '#packages/intl/src/plural.js'
export {formatRelativeTime} from '#packages/intl/src/relativeTime.js'
export {formatNumber, formatNumberToParts} from '#packages/intl/src/number.js'
export {createIntl} from '#packages/intl/src/create-intl.js'
export type {CreateIntlFn} from '#packages/intl/src/create-intl.js'
