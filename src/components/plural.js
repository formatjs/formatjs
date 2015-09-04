/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {Component, DOM, PropTypes} from 'react';
import {intlShape, pluralFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedPlural extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatPlural} = this.context.intl;
        const props          = this.props;

        let pluralCategory  = formatPlural(props.value, props);
        let formattedPlural = props[pluralCategory] || props.other;

        if (typeof props.children === 'function') {
            return props.children(formattedPlural);
        }

        return DOM.span(null, formattedPlural);
    }
}

FormattedPlural.propTypes = {
    ...pluralFormatPropTypes,
    value: PropTypes.any.isRequired,

    // TODO: Should these be functions instead nodes (or?), so that complex
    // nested elements don't have to incur the cost of rendering when they are
    // not used?
    other: PropTypes.node.isRequired,
    zero : PropTypes.node,
    one  : PropTypes.node,
    two  : PropTypes.node,
    few  : PropTypes.node,
    many : PropTypes.node,
};

FormattedPlural.defaultProps = {
    style: 'cardinal',
};

FormattedPlural.contextTypes = {
    intl: intlShape.isRequired,
};
