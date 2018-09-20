import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

const messages = defineMessages({
    copyright: {
        id: 'app-footer__copyright',
        defaultMessage: '© 2017 Future Testing',
    },
});

export default () => (
    <footer className="app-footer">
        <div className="app-footer__copyright">
            <FormattedMessage {...messages.copyright} />
        </div>
    </footer>
);
