// @react-intl project:foo file:bar
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
    description: 'Another message',
  },
  kittens: {
    id: 'app.home.kittens',
    description: 'Counts kittens',
    defaultMessage: '{count, plural, =0 {😭} one {# kitten} other {# kittens}}',
  },
  trailingWhitespace: {
    id: 'trailing.ws',
    description: 'Whitespace',
    defaultMessage: '   Some whitespace   ',
  },
  escaped: {
    id: 'escaped.apostrophe',
    description: 'Escaped apostrophe',
    defaultMessage: "A quoted value ''{value}'",
  },
  quoted: {
    id: 'escaped.apostrophe',
    description: 'Escaped apostrophe',
    defaultMessage: "What's going on",
  },
  newline: {
    id: 'newline',
    description: 'this is \
    a \
    description',
    defaultMessage: 'this is \
    a message',
  },
} as const);

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
        <p>
          <FormattedMessage {...msgs.kittens} />
          <FormattedMessage
            id="inline"
            defaultMessage="formatted message"
            description="foo"
          />
        </p>
      </div>
    );
  }
}
