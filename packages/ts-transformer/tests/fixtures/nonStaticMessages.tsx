import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// #4235: Non-static strings should throw an error
export function NonStaticMessages() {
  const dynamicValue = Math.random()
  const intl = useIntl()

  return (
    <div>
      {/* This should throw an error - template literal with expression */}
      <FormattedMessage
        defaultMessage={`${dynamicValue} not statically analyzable`}
      />

      {/* This should also throw - variable concatenation */}
      <FormattedMessage defaultMessage={`Value: ${dynamicValue}`} />

      {/* This should throw - variable reference */}
      <FormattedMessage defaultMessage={dynamicValue as any} />

      {/* formatMessage with non-static string should also throw */}
      {intl.formatMessage({
        defaultMessage: `Dynamic: ${dynamicValue}`,
      })}
    </div>
  )
}
