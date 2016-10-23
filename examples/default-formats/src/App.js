import React from 'react';
import {FormattedTime} from 'react-intl';

export default () => {
    const currentTime = new Date();

    return <p>The time in Tokyo is: <FormattedTime value={currentTime} /></p>;
};
