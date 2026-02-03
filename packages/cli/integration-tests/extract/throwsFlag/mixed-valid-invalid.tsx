import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// This file has a mix of valid and invalid messages
// When throws: false, we should get partial results (the valid messages)
// When throws: true, extraction should fail

export function MixedMessages() {
  const intl = useIntl()

  return (
    <div>
      {/* Valid message 1 - should always be extracted */}
      <FormattedMessage
        id="valid-message-1"
        defaultMessage="This is a valid message"
      />

      {/* Valid message 2 - should always be extracted */}
      <FormattedMessage
        id="valid-message-2"
        defaultMessage="Another valid message"
      />

      {/* Invalid message - dynamic ID with idInterpolationPattern */}
      <FormattedMessage
        id={dynamicValue}
        defaultMessage="This has a dynamic ID and should fail with strict checks"
      />

      {/* Valid message 3 - should be extracted when throws: false */}
      <FormattedMessage
        id="valid-message-3"
        defaultMessage="Third valid message"
      />

      {/* Another invalid message - template literal ID */}
      <FormattedMessage
        id={`prefix-${dynamicValue}`}
        defaultMessage="This also has a dynamic ID"
      />

      {/* Valid message 4 - should be extracted when throws: false */}
      {intl.formatMessage({
        id: 'valid-message-4',
        defaultMessage: 'Fourth valid message from formatMessage',
      })}
    </div>
  )
}
