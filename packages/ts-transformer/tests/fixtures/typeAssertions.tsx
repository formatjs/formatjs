import React from 'react'
import {defineMessage, defineMessages, FormattedMessage} from 'react-intl'

type DefaultMessage = string
type MessageDescriptor = {
  id: string
  defaultMessage: string
}

defineMessage({
  id: 'define.satisfies',
  defaultMessage: `Define satisfies` satisfies DefaultMessage,
})

defineMessage({
  id: 'define.as',
  defaultMessage: 'Define as' as DefaultMessage,
})

defineMessage({
  id: 'define.object.satisfies',
  defaultMessage: 'Define object satisfies',
} satisfies MessageDescriptor)

defineMessages({
  one: {
    id: 'messages.satisfies',
    defaultMessage: 'Messages satisfies' satisfies DefaultMessage,
  },
  two: {
    id: 'messages.as',
    defaultMessage: `Messages as` as DefaultMessage,
  },
} satisfies Record<string, MessageDescriptor>)

intl.formatMessage({
  id: 'format.satisfies',
  defaultMessage: `Format satisfies` satisfies DefaultMessage,
})

export function Component() {
  return (
    <>
      <FormattedMessage
        id="jsx.satisfies"
        defaultMessage={`JSX satisfies` satisfies DefaultMessage}
      />
      <FormattedMessage
        id="jsx.as"
        defaultMessage={'JSX as' as DefaultMessage}
      />
    </>
  )
}
