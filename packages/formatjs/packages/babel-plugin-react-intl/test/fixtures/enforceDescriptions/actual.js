import {FormattedMessage} from 'react-intl';
import React from 'react';

export default class Foo extends React.Component {
    render() {
        return <FormattedMessage id="foo.bar.baz" defaultMessage="Hello World!" />
    }
}
