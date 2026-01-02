import {defineMessages} from 'react-intl'

defineMessages({
  foo: {
    defaultMessage: 'I have {count, plural, one{a dog} other{many dogs}}',
  },
  bar: {
    defaultMessage:
      '{topicCount, plural, one {# topic} other {# topics}} and {noteCount, plural, one {# note} other {# notes}}',
  },
})
