import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

export const enum TestEnum {
  FOO = 'foo',
  BAR = 'bar',
}

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
  noId: {
    description: 'no ID',
    defaultMessage: "No ID",
  },
  duplicateAsNoId: {
    description: 'no ID',
    defaultMessage: "No ID",
  }
} as const);

async function foo () {
  await import('../../package.json')
}

export default class Foo extends Component<{}, {}> {
  async componentDidMount () {
    await foo()
  }
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
          <FormattedMessage id="inline" defaultMessage="formatted message" description="foo" />
        </p>
      </div>
    );
  }
}
