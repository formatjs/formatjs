import React from 'react'
import {useIntl} from 'react-intl'

// GH #4471: Test optional chaining with formatMessage
export function OptionalChainingComponent() {
  const intl = useIntl()

  return (
    <div>
      {/* Normal call - baseline */}
      <p>{intl.formatMessage({defaultMessage: 'Normal call'})}</p>

      {/* With generics */}
      <p>
        {intl.formatMessage<HTMLElement>({
          defaultMessage: 'With generics',
          description: 'formatMessage with generic type parameter',
        })}
      </p>

      {/* With optional chaining */}
      <p>
        {intl.formatMessage?.({
          defaultMessage: 'With optional chaining',
          description: 'formatMessage with optional chaining operator',
        })}
      </p>

      {/* With both generics and optional chaining - the problematic case */}
      <p>
        {intl.formatMessage<HTMLElement>?.({
          defaultMessage: 'With both generics and optional chaining',
          description:
            'formatMessage with both generic type parameter and optional chaining',
        })}
      </p>

      {/* Nested optional chaining */}
      <p>
        {intl?.formatMessage?.({
          defaultMessage: 'Nested optional chaining',
          description: 'formatMessage with nested optional chaining',
        })}
      </p>
    </div>
  )
}
