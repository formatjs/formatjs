/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

export default class FormattedDate extends Component {
    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatDate} = this.context.intl;
        const props        = this.props;

        let formattedDate = formatDate(props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedDate);
        }

        return <span>{formattedDate}</span>;
    }
}

FormattedDate.displayName = 'FormattedDate';

FormattedDate.contextTypes = {
    intl: intlShape,
};

FormattedDate.propTypes = {
    ...dateTimeFormatPropTypes,
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
};
