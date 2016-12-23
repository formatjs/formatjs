import React, {PropTypes} from 'react';
import {
    FormattedMessage,
    FormattedNumber,
    FormattedRelative,
    IntlProvider,
} from 'react-intl';

const Greeting = ({messages, locale, name, unreadCount, lastLoginTime}) => (
    <IntlProvider messages={messages} locale={locale}>
        <p>
            <FormattedMessage
                id="greeting.welcome_message"
                defaultMessage={`
                    Welcome {name}, you have received {unreadCount, plural,
                        =0 {no new messages}
                        one {{formattedUnreadCount} new message}
                        other {{formattedUnreadCount} new messages}
                    } since {formattedLastLoginTime}.
                `}
                values={{
                    name: <b>{name}</b>,
                    unreadCount: unreadCount,
                    formattedUnreadCount: (
                        <b><FormattedNumber value={unreadCount} /></b>
                    ),
                    formattedLastLoginTime: (
                        <FormattedRelative
                            value={lastLoginTime}
                            updateInterval={1000}
                        />
                    ),
                }}
            />
        </p>
    </IntlProvider>
);

Greeting.propTypes = {
    messages     : PropTypes.object,
    locale       : PropTypes.string,
    name         : PropTypes.node.isRequired,
    unreadCount  : PropTypes.number.isRequired,
    lastLoginTime: PropTypes.any.isRequired,
};

export default Greeting;
