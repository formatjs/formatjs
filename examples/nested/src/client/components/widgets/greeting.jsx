import * as React from 'react';
import * as PropTypes from 'prop-types';
import {
  FormattedMessage,
  FormattedNumber,
  FormattedRelativeTime,
} from 'react-intl';

const Greeting = ({name, unreadCount, lastLoginTime}) => (
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
        name,
        b: msg => <b>{msg}</b>,
        unreadCount,
        formattedLastLoginTime: () => (
          <FormattedRelativeTime
            value={lastLoginTime}
            updateIntervalInSeconds={1}
          />
        ),
      }}
    />
  </p>
);

Greeting.propTypes = {
  name: PropTypes.node.isRequired,
  unreadCount: PropTypes.number.isRequired,
  lastLoginTime: PropTypes.any.isRequired,
};

export default Greeting;
