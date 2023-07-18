import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
function nonStaticId() {
  return 'baz'
}

export default function IndexPage() {
  const intl = useIntl()
  return (
    <>
      <h1>{intl.formatMessage({id: `test`})}</h1>

      <h1>{intl.formatMessage({id: 'test.' + nonStaticId()})}</h1>
      <h1>
        {intl.formatMessage({
          id: `test.${nonStaticId}`,
          defaultMessage: 'testMassage',
        })}
      </h1>
    </>
  )
}
