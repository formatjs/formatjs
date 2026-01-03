import {expectType} from 'tsd'
import type {
  FormattedDate,
  FormattedDateParts,
  FormattedTime,
  FormattedTimeParts,
} from '../'
import type {ComponentProps} from 'react'

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
expectType<'short' | 'long'>(
  null as any as NonNullable<
    ComponentProps<typeof FormattedDateParts>['format']
  >
)
expectType<'medium' | 'full'>(
  null as any as NonNullable<ComponentProps<typeof FormattedTime>['format']>
)
expectType<'medium' | 'full'>(
  null as any as NonNullable<
    ComponentProps<typeof FormattedTimeParts>['format']
  >
)
