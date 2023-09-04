import {useMemo} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'

export default function IndexPage() {
  const intl = useIntl()

  const anotherMessage = useMemo(
    () => (
      <FormattedMessage
        defaultMessage="Hello, World #1!"
        description="Index Page: Content #1"
      />
    ),
    []
  )

  return (
    <main
      title={intl.formatMessage({
        defaultMessage: 'Home',
        description: 'Index Page: document title',
      })}
      description={intl.formatMessage({
        defaultMessage: 'An example app integrating React Intl with Next.js',
        description: 'Index Page: Meta Description',
      })}
    >
      <p>
        <FormattedMessage
          defaultMessage="Hello, World #2!"
          description="Index Page: Content #2"
        />
      </p>
      <p>{anotherMessage}</p>
      <div>
        {[...Array(10)].map((_, i) => (
          <FormattedMessage
            defaultMessage="Hello, World #3!"
            description="Index Page: Content #3"
          />
        ))}
      </div>
      <p>
        <FormattedNumber value={1000} />
      </p>
    </main>
  )
}
