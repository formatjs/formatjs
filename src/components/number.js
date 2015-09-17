/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, numberFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedNumber extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatNumber} = this.context.intl;
        const props          = this.props;

        let formattedNumber = formatNumber(props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedNumber);
        }

        return <span>{formattedNumber}</span>;
    }
}

FormattedNumber.propTypes = {
    ...numberFormatPropTypes,
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
};

FormattedNumber.contextTypes = {
    intl: intlShape.isRequired,
};
