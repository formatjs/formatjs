import * as React from 'react'
import {
  FormatDateOptions,
  FormatNumberOptions,
  FormatListOptions,
  FormatDisplayNameOptions,
} from '@formatjs/intl'
import {IntlShape} from '../types'
import useIntl from './useIntl'
import {Part} from '@formatjs/intl-listformat'

enum DisplayName {
  formatDate = 'FormattedDate',
  formatTime = 'FormattedTime',
  formatNumber = 'FormattedNumber',
  formatList = 'FormattedList',
  // Note that this DisplayName is the locale display name, not to be confused with
  // the name of the enum, which is for React component display name in dev tools.
  formatDisplayName = 'FormattedDisplayName',
}

enum DisplayNameParts {
  formatDate = 'FormattedDateParts',
  formatTime = 'FormattedTimeParts',
  formatNumber = 'FormattedNumberParts',
  formatList = 'FormattedListParts',
}

type Formatter = {
  formatDate: FormatDateOptions
  formatTime: FormatDateOptions
  formatNumber: FormatNumberOptions
  formatList: FormatListOptions
  formatDisplayName: FormatDisplayNameOptions
}

export const FormattedNumberParts: React.FC<
  Formatter['formatNumber'] & {
    value: Parameters<IntlShape['formatNumber']>[0]

    children(val: Intl.NumberFormatPart[]): React.ReactChild | null
  }
> = props => {
  const intl = useIntl()
  const {value, children, ...formatProps} = props
  return children(intl.formatNumberToParts(value, formatProps))
}
FormattedNumberParts.displayName = 'FormattedNumberParts'

export const FormattedListParts: React.FC<
  Formatter['formatList'] & {
    value: Parameters<IntlShape['formatList']>[0]

    children(val: Part[]): React.ReactElement | null
  }
> = props => {
  const intl = useIntl()
  const {value, children, ...formatProps} = props
  return children(intl.formatListToParts(value, formatProps))
}
FormattedNumberParts.displayName = 'FormattedNumberParts'

export function createFormattedDateTimePartsComponent<
  Name extends 'formatDate' | 'formatTime'
>(
  name: Name
): React.FC<
  Formatter[Name] & {
    value: Parameters<IntlShape[Name]>[0]
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null
  }
> {
  type FormatFn = IntlShape[Name]
  type Props = Formatter[Name] & {
    value: Parameters<FormatFn>[0]
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null
  }

  const ComponentParts: React.FC<Props> = props => {
    const intl = useIntl()
    const {value, children, ...formatProps} = props
    const date = typeof value === 'string' ? new Date(value || 0) : value
    const formattedParts: Intl.DateTimeFormatPart[] =
      name === 'formatDate'
        ? intl.formatDateToParts(date, formatProps)
        : intl.formatTimeToParts(date, formatProps)

    return children(formattedParts)
  }
  ComponentParts.displayName = DisplayNameParts[name]
  return ComponentParts
}

export function createFormattedComponent<Name extends keyof Formatter>(
  name: Name
): React.FC<
  Formatter[Name] & {
    value: Parameters<IntlShape[Name]>[0]
    children?(val: string): React.ReactElement | null
  }
> {
  type FormatFn = IntlShape[Name]
  type Props = Formatter[Name] & {
    value: Parameters<FormatFn>[0]
    children?(val: string): React.ReactElement | null
  }

  const Component: React.FC<Props> = props => {
    const intl = useIntl()
    const {value, children, ...formatProps} = props
    // TODO: fix TS type definition for localeMatcher upstream
    const formattedValue = intl[name](value as any, formatProps as any)

    if (typeof children === 'function') {
      return children(formattedValue as any)
    }
    const Text = intl.textComponent || React.Fragment
    return <Text>{formattedValue}</Text>
  }

  Component.displayName = DisplayName[name]
  return Component
}
