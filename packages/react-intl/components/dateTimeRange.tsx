import {
  type FormatDateTimeRangeOptions,
  type IntlFormatters,
} from '@formatjs/intl'
import * as React from 'react'
import useIntl from '#packages/react-intl/components/useIntl.js'

interface Props extends FormatDateTimeRangeOptions {
  from: Parameters<IntlFormatters['formatDateTimeRange']>[0]
  to: Parameters<IntlFormatters['formatDateTimeRange']>[1]
  children?(value: React.ReactNode): React.ReactElement | null
}

const FormattedDateTimeRange: React.FC<Props> = props => {
  const intl = useIntl()

  const {from, to, children, ...formatProps} = props
  const formattedValue = intl.formatDateTimeRange(from, to, formatProps)

  if (typeof children === 'function') {
    return children(formattedValue as any)
  }
  const Text = intl.textComponent || React.Fragment
  return <Text>{formattedValue}</Text>
}

FormattedDateTimeRange.displayName = 'FormattedDateTimeRange'
export default FormattedDateTimeRange
