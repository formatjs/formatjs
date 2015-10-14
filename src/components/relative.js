/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, relativeFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

export default class FormattedRelative extends Component {
    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatRelative} = this.context.intl;
        const props            = this.props;

        let formattedRelative = formatRelative(props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedRelative);
        }

        return <span>{formattedRelative}</span>;
    }
}

FormattedRelative.displayName = 'FormattedRelative';

FormattedRelative.contextTypes = {
    intl: intlShape,
};

FormattedRelative.propTypes = {
    ...relativeFormatPropTypes,
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
    now   : PropTypes.any,
};
