import React, {Component} from 'react';
import {
  defineMessages,
  FormattedMessage,
  FormattedHTMLMessage,
} from 'react-intl';

const msgs = defineMessages({
  header: {
    id: 'foo.bar.baz',
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
          id="foo.bar.zoo"
          defaultMessage="Hello World!"
          description={{
            text: 'Something for the translator. Another description',
            metadata: 'Additional metadata content.',
          }}
        />
        <FormattedHTMLMessage
          id="foo.bar.delta"
          defaultMessage="<h1>Hello World!</h1>"
          description="The default message."
        />
      </div>
    );
  }
}
