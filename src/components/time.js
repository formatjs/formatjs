/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedTime extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatTime} = this.context.intl;
        const props        = this.props;

        let formattedTime = formatTime(props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedTime);
        }

        return <span>{formattedTime}</span>;
    }
}

FormattedTime.propTypes = {
    ...dateTimeFormatPropTypes,
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
};

FormattedTime.contextTypes = {
    intl: intlShape.isRequired,
};
