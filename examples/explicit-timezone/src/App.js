import React from 'react';
import {FormattedDate, FormattedTime} from 'react-intl';

export default (props) => {
    return <span>
        <FormattedDate value={props.currentTime} />
        &nbsp;
        <FormattedTime value={props.currentTime} />
    </span>;
};
