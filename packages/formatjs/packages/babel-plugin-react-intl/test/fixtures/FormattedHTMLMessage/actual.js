import {FormattedHTMLMessage} from 'react-intl';
import React from 'react';

export default class Foo extends React.Component {
    render() {
        return <FormattedHTMLMessage id="foo.bar.baz" defaultMessage="<h1>Hello World!</h1>" description="The default message." />;
    }
}
