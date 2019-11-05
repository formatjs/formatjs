import React, {Component} from 'react';
import {FormattedMessage} from 'react-i18n';
import {defineMessages} from 'react-intl';

// These should be ignored because the `moduleSourceName` is configured to be:
// `react-i18n`.
const msgs = defineMessages({
  header: {
    id: 'header',
    defaultMessage: 'Hello World!',
    description: 'The default message',
  },
  content: {
    id: 'content',
    defaultMessage: 'Hello Nurse!',
    description: 'Another message',
  },
});

export default class Foo extends Component {
  render() {
    return (
      <div>
        <FormattedMessage
          id="foo.bar.baz"
          defaultMessage="Hello World!"
          description="The default message."
        />
        {msgs}
      </div>
    );
  }
}
