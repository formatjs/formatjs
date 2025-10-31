import {expectType} from 'tsd'
import {FormattedDate, FormattedTime} from '../'
import {ComponentProps} from 'react'

declare global {
  namespace FormatjsIntl {
    interface Formats {
      date: 'short' | 'long'
      time: 'medium' | 'full'
    }
  }
}

expectType<'short' | 'long'>(
  null as any as NonNullable<ComponentProps<typeof FormattedDate>['format']>
)
expectType<'medium' | 'full'>(
  null as any as NonNullable<ComponentProps<typeof FormattedTime>['format']>
)
