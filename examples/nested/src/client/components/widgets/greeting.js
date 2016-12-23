import React, {PropTypes} from 'react';
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
                name: <b key='name'>{name}</b>,
                unreadCount: unreadCount,
                formattedUnreadCount: (
                    <b key='formattedUnreadCount'>
                        <FormattedNumber value={unreadCount} />
                    </b>
                ),
                formattedLastLoginTime: (
                    <FormattedRelative
                        key='formattedLastLoginTime'
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
