import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
  header: {
    defaultMessage: 'Hello World!',
    description: 'The default message',
  },
  content: {
    id: 'foo.bar.biff',
    defaultMessage: 'Hello Nurse!',
    description: {
      text: 'Something for the translator.',
      metadata: 'Additional metadata content.',
    },
  },
});

export default class Foo extends Component {
  render() {
    return (
      <div>
        <h1>
          <FormattedMessage {...msgs.header} />
        </h1>
        <p>
          <FormattedMessage {...msgs.content} />
        </p>
        <FormattedMessage
          defaultMessage="Hello World!"
          description="Something for the translator. Another description"
        />
        <FormattedMessage
          defaultMessage="NO ID"
          description="Something for the translator. Another description"
        />
      </div>
    );
  }
}
