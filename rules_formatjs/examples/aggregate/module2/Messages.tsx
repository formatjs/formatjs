import {FormattedMessage} from 'react-intl'

export function Module2Messages() {
  return (
    <>
      <FormattedMessage
        id="module2.title"
        defaultMessage="Module 2 Title"
        description="Title for module 2"
      />
      <FormattedMessage
        id="module2.description"
        defaultMessage="This is the second module"
        description="Description for module 2"
      />
    </>
  )
}
