import React, {Component} from 'react';
import {defineMessages, FormattedMessage, defineMessage} from 'react-intl';

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

defineMessage({
  defaultMessage: 'defineMessage',
  description: 'foo',
});

export default class Foo extends Component {
  render() {
    const {intl} = this.props;
    const {formatMessage} = intl;
    this.props.intl.formatMessage({
      defaultMessage: 'no-id',
      description: 'no-id',
    });
    intl.formatMessage({
      defaultMessage: 'intl.formatMessage',
      description: 'no-id',
    });
    formatMessage({
      defaultMessage: 'formatMessage',
      description: 'no-id',
    });

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
      </div>
    );
  }
}
