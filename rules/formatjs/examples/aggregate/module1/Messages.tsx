import {FormattedMessage} from 'react-intl'

export function Module1Messages() {
  return (
    <>
      <FormattedMessage
        id="module1.title"
        defaultMessage="Module 1 Title"
        description="Title for module 1"
      />
      <FormattedMessage
        id="module1.description"
        defaultMessage="This is the first module"
        description="Description for module 1"
      />
    </>
  )
}
