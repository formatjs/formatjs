import React from 'react';
import PropTypes from 'prop-types';
import {
    FormattedMessage,
    FormattedNumber,
    FormattedRelative,
} from 'react-intl';

const Greeting = ({name, unreadCount, lastLoginTime}) => (
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
                    <b>
                        <FormattedNumber value={unreadCount} />
                    </b>
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
);

Greeting.propTypes = {
    name         : PropTypes.node.isRequired,
    unreadCount  : PropTypes.number.isRequired,
    lastLoginTime: PropTypes.any.isRequired,
};

export default Greeting;
