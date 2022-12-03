import {expectType} from 'tsd'
import {MessageDescriptor, ResolvedIntlConfig} from '../src/types'

// Example type overrides
declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: 'a' | 'b'
    }
    interface IntlConfig {
      locale: 'en-US' | 'zh-CN'
    }
  }
}

// Check that the type overrides actually work.
expectType<'a' | 'b'>(null as any as NonNullable<MessageDescriptor['id']>)
expectType<'en-US' | 'zh-CN'>(null as any as ResolvedIntlConfig['locale'])
