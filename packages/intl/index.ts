import {type MessageDescriptor} from '#packages/intl/types.js'
export * from '#packages/intl/types.js'

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
} from '#packages/intl/utils.js'
export * from '#packages/intl/error.js'
export {formatMessage} from '#packages/intl/message.js'
export type {FormatMessageFn} from '#packages/intl/message.js'
export {
  formatDate,
  formatDateToParts,
  formatTime,
  formatTimeToParts,
} from '#packages/intl/dateTime.js'
export {formatDisplayName} from '#packages/intl/displayName.js'
export {formatList} from '#packages/intl/list.js'
export {formatPlural} from '#packages/intl/plural.js'
export {formatRelativeTime} from '#packages/intl/relativeTime.js'
export {formatNumber, formatNumberToParts} from '#packages/intl/number.js'
export {createIntl} from '#packages/intl/create-intl.js'
export type {CreateIntlFn} from '#packages/intl/create-intl.js'
