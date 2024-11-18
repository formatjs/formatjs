import {FormatDateOptions} from '@formatjs/intl'
import * as React from 'react'
import useIntl from './useIntl'

interface Props extends FormatDateOptions {
  from: Parameters<Intl.DateTimeFormat['formatRange']>[0]
  to: Parameters<Intl.DateTimeFormat['formatRange']>[1]
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
