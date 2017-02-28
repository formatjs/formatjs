/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, pluralFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

export default class FormattedPlural extends Component {
    static displayName = 'FormattedPlural';

    static contextTypes = {
        intl: intlShape,
    };

    static propTypes = {
        ...pluralFormatPropTypes,
        value: PropTypes.any.isRequired,

        other: PropTypes.node.isRequired,
        zero : PropTypes.node,
        one  : PropTypes.node,
        two  : PropTypes.node,
        few  : PropTypes.node,
        many : PropTypes.node,

        tagName  : PropTypes.string,
        className: PropTypes.string,
        children : PropTypes.func,
    };

    static defaultProps = {
        style: 'cardinal',
    };

    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatPlural, textComponent: Text} = this.context.intl;
        const {
            value,
            other,
            tagName: Component = Text,
            className,
            children,
        } = this.props;

        let pluralCategory  = formatPlural(value, this.props);
        let formattedPlural = this.props[pluralCategory] || other;

        if (typeof children === 'function') {
            return children(formattedPlural);
        }

        const componentProps = {
            children: formattedPlural,
        };
        if (className) {
            Object.assign(componentProps, {className});
        }

        return <Component {...componentProps} />;
    }
}
