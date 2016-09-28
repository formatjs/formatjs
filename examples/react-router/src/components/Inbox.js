import React from 'react';
import {
    FormattedNumber,
    FormattedPlural,
} from 'react-intl';

const Inbox = () => (
    <div>
        <h2>Inbox</h2>
        <p>
            You have {' '}
            <FormattedNumber value={1000} /> {' '}
            <FormattedPlural value={1000}
                one="message"
                other="messages"
            />.
        </p>
    </div>
);

export default Inbox;
