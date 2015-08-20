import React, {Component, PropTypes} from 'react';
import {FormattedNumber, FormattedPlural} from 'react-intl';

class HelloMessage extends Component {
    render() {
        return (
            <p>
                Hello {this.props.name}, you have {' '}
                <FormattedNumber value={this.props.unreadCount} />
                <FormattedPlural value={this.props.unreadCount}
                    one=" unread message."
                    other=" unread messages."
                />
            </p>
        );
    }
}

HelloMessage.propTypes = {
    name       : PropTypes.node.isRequired,
    unreadCount: PropTypes.number.isRequired,
};

export default HelloMessage;
