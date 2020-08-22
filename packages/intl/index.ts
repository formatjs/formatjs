import {MessageDescriptor} from './src/types';
export * from './src/types';

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>
>(msgs: U): U {
  return msgs;
}

export function defineMessage<T>(msg: T): T {
  return msg;
}

export {
  createIntlCache,
  filterProps,
  DEFAULT_INTL_CONFIG,
  createFormatters,
  getNamedFormat,
} from './src/utils';
export * from './src/error';
export {formatMessage} from './src/message';
export {
  formatDate,
  formatDateToParts,
  formatTime,
  formatTimeToParts,
} from './src/dateTime';
export {formatDisplayName} from './src/displayName';
export {formatList} from './src/list';
export {formatPlural} from './src/plural';
export {formatRelativeTime} from './src/relativeTime';
export {formatNumber, formatNumberToParts} from './src/number';
