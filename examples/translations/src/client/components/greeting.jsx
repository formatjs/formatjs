import React, {Component} from 'react';
import * as PropTypes from 'prop-types';
import {FormattedMessage, FormattedRelative} from 'react-intl';

class Greeting extends Component {
  render() {
    const {user} = this.props;

    return (
      <p>
        <FormattedMessage
          id="greeting.welcome_message"
          defaultMessage={`
                        Welcome <b>{name}</b>, you have received {unreadCount, plural,
                            =0 {no new messages}
                            one {<b>#</b> new message}
                            other {<b>#</b> new messages}
                        } since <formattedLastLoginTime/>.
                    `}
          values={{
            name: user.name,
            b: msg => <b>{msg}</b>,
            unreadCount: user.unreadCount,
            formattedLastLoginTime: () => (
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
