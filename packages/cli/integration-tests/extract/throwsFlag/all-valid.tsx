import React from 'react'
import {FormattedMessage} from 'react-intl'

// This file has only valid messages
export function AllValidMessages() {
  return (
    <div>
      <FormattedMessage
        id="all-valid-1"
        defaultMessage="First valid message"
      />
      <FormattedMessage
        id="all-valid-2"
        defaultMessage="Second valid message"
      />
    </div>
  )
}
