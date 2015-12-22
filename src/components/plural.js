/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, pluralFormatPropTypes} from '../types';
import {
    invariantIntlContext,
    shouldIntlComponentUpdate,
    prepareIntlStyleOption,
} from '../utils';

export default class FormattedPlural extends Component {
    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatPlural} = this.context.intl;
        const {value, other, children, style, className} = this.props;

        let pluralCategory  = formatPlural(value, prepareIntlStyleOption(this.props));
        let formattedPlural = this.props[pluralCategory] || other;

        if (typeof children === 'function') {
            return children(formattedPlural);
        }

        return <span style={style} className={className}>{formattedPlural}</span>;
    }
}

FormattedPlural.displayName = 'FormattedPlural';

FormattedPlural.contextTypes = {
    intl: intlShape,
};

FormattedPlural.propTypes = {
    ...pluralFormatPropTypes,
    value: PropTypes.any.isRequired,

    other: PropTypes.node.isRequired,
    zero : PropTypes.node,
    one  : PropTypes.node,
    two  : PropTypes.node,
    few  : PropTypes.node,
    many : PropTypes.node,

    children : PropTypes.func,
    style    : PropTypes.any,
    className: PropTypes.any,
};

FormattedPlural.defaultProps = {
    intlStyle: 'cardinal',
};
