// @react-intl project:amazing
import React, {Component} from 'react';
import {defineMessage, FormattedMessage} from 'react-intl';

const msgs = {
  header: defineMessage({
    id: 'foo.bar.baz',
    defaultMessage: 'Hello World!',
    description: 'The default message',
  }),
  content: defineMessage({
    id: 'foo.bar.biff',
    defaultMessage: 'Hello Nurse!',
    description: 'Another message',
  }),
  kittens: defineMessage({
    id: 'app.home.kittens',
    description: 'Counts kittens',
    defaultMessage: '{count, plural, =0 {😭} one {# kitten} other {# kittens}}',
  }),
  trailingWhitespace: defineMessage({
    id: 'trailing.ws',
    description: 'Whitespace',
    defaultMessage: '   Some whitespace   ',
  }),
  escaped: defineMessage({
    id: 'escaped.apostrophe',
    description: 'Escaped apostrophe',
    defaultMessage: "A quoted value ''{value}'",
  }),
};

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
        </p>
      </div>
    );
  }
}
