import {FormattedMessage} from 'react-i18n';
import {defineMessages} from 'react-intl';
import React from 'react';

export default class Foo extends React.Component {
    render() {
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
        });
        return (
            <div>
                <FormattedMessage id="foo.bar.baz" defaultMessage="Hello World!" description="The default message." />
                {msgs}
            </div>
        );
    }
}
