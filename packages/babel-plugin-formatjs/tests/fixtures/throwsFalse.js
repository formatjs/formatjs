import React from 'react'
import {FormattedMessage, defineMessages, useIntl} from 'react-intl'

defineMessages({
  staticMessage: {
    defaultMessage: 'Static defineMessages message',
    description: 'Static defineMessages description',
  },
  dynamicId: {
    id: window.location.hash,
    defaultMessage: 'Dynamic defineMessages id',
  },
})

export function Example({status}) {
  const intl = useIntl()

  return (
    <div>
      {intl.formatMessage({
        defaultMessage: 'Static formatMessage message',
        description: 'Static formatMessage description',
      })}
      {intl.formatMessage({
        id: status,
      })}
      {intl.formatMessage({
        defaultMessage: getDynamicMessage(),
      })}
      {intl.formatMessage({
        defaultMessage: intl.formatMessage({
          defaultMessage: 'Nested static formatMessage message',
          description: 'Nested static formatMessage description',
        }),
      })}
      <FormattedMessage
        defaultMessage="Static JSX message"
        description="Static JSX description"
      />
      <FormattedMessage
        id={`Agent.Details.Status.${status}`}
        defaultMessage="Dynamic JSX id"
      />
    </div>
  )
}
