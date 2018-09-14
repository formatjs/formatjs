import React, {PropTypes} from 'react';
import {IntlProvider, FormattedMessage} from 'react-intl';

const Message = ({getIntlMessages, app, container}) => (
    <i>
        <IntlProvider messages={getIntlMessages('message')}>
            <FormattedMessage
                id="prefix"
                defaultMessage={'This message is brought to you by '}
            />
        </IntlProvider>

        <b>{app}</b>

        <IntlProvider messages={getIntlMessages('message')}>
            <FormattedMessage
                id="infix"
                defaultMessage={' via '}
            />
        </IntlProvider>

        <b>{container}</b>

        .
    </i>
);

Message.propTypes = {
    getIntlMessages: PropTypes.func.isRequired,
    app: PropTypes.element.isRequired,
    container: PropTypes.element.isRequired,
};

export default Message;
