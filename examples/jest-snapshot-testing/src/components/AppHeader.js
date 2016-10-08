import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

const messages = defineMessages({
    title: {
        id: 'app-header__title',
        defaultMessage: 'React Intl + Jest Snapshot Testing Example',
    },
});

export default () => (
    <header className="app-header">
        <div className="app-header__title">
            <FormattedMessage {...messages.title} />
        </div>
    </header>
);
