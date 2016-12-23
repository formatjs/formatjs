import React, {Component, PropTypes} from 'react';
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
                        name: <b key='name'>{user.name}</b>,
                        unreadCount: user.unreadCount,
                        formattedUnreadCount: (
                            <b key='formattedUnreadCount'>
                                <FormattedNumber value={user.unreadCount} />
                            </b>
                        ),
                        formattedLastLoginTime: (
                            <FormattedRelative
                                key='formattedLastLoginTime'
                                value={user.lastLoginTime}
                            />
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
