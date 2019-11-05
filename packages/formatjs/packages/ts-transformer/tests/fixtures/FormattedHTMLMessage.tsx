import React, {Component} from 'react';
import {FormattedHTMLMessage} from 'react-intl';

export default class Foo extends Component {
  render() {
    return (
      <FormattedHTMLMessage
        id="foo.bar.baz"
        defaultMessage="<h1>Hello World!</h1>"
        description="The default message."
      />
    );
  }
}
