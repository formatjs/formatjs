import {FormattedMessage} from 'react-intl'

export default function Test() {
  return (
    <FormattedMessage
      id="test.message"
      defaultMessage="Hello <b>{count, plural, one {# item} other {# items}}</b>"
    />
  )
}
