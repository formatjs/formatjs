import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage, FormattedNumber, FormattedRelative} from 'react-intl';

class Greeting extends Component {
    render() {
        const {user} = this.props;

        return (
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
                        name: <b>{user.name}</b>,
                        unreadCount: user.unreadCount,
                        formattedUnreadCount: (
                            <b>
                                <FormattedNumber value={user.unreadCount} />
                            </b>
                        ),
                        formattedLastLoginTime: (
                            <FormattedRelative value={user.lastLoginTime} />
                        ),
                    }}
                />
            </p>
        );
    }
}

Greeting.propTypes = {
    user: PropTypes.object.isRequired,
};

export default Greeting;
