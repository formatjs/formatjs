import {expectType} from 'tsd'
import {
  IntlFormatters,
  MessageDescriptor,
  ResolvedIntlConfig,
} from '../src/types'

// Example type overrides
declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: 'a' | 'b'
    }
    interface IntlConfig {
      locale: 'en-US' | 'zh-CN'
    }
    interface Formats {
      date: 'short' | 'long'
      time: 'medium' | 'full'
    }
  }
}

// Check that the type overrides actually work.
expectType<'a' | 'b'>(null as any as NonNullable<MessageDescriptor['id']>)
expectType<'en-US' | 'zh-CN'>(null as any as ResolvedIntlConfig['locale'])

expectType<'short' | 'long'>(
  null as any as NonNullable<
    NonNullable<Parameters<IntlFormatters['formatDate']>[1]>['format']
  >
)

expectType<'medium' | 'full'>(
  null as any as NonNullable<
    NonNullable<Parameters<IntlFormatters['formatTime']>[1]>['format']
  >
)
