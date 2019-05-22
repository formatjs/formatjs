import React, {Component} from 'react';
import {injectIntl} from 'react-intl';

class Foo extends Component {
    render() {
        const msgs = {
            baz: this.props.intl.formatMessage({
                id: 'foo.bar.baz',
                defaultMessage: 'Hello World!',
                description: 'The default message',
            }),
            biff: this.props.intl.formatMessage({
                id: 'foo.bar.biff',
                defaultMessage: 'Hello Nurse!',
                description: 'Another message',
            }),
        };

        return (
            <div>
                <h1>{msgs.header}</h1>
                <p>{msgs.content}</p>
            </div>
        );
    }
}

export default injectIntl(Foo);
