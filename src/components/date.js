/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {Component, DOM, PropTypes} from 'react';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedDate extends Component {
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

        return DOM.span(null, formattedDate);
    }
}

FormattedDate.propTypes = {
    ...dateTimeFormatPropTypes,
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
};

FormattedDate.contextTypes = {
    intl: intlShape.isRequired,
};
