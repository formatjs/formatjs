/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

export default class FormattedTime extends Component {
    static displayName = 'FormattedTime';

    static contextTypes = {
        intl: intlShape,
    };

    static propTypes = {
        ...dateTimeFormatPropTypes,
        value    : PropTypes.any.isRequired,
        format   : PropTypes.string,
        tagName  : PropTypes.string,
        className: PropTypes.string,
        children : PropTypes.func,
    };

    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatTime, textComponent: Text} = this.context.intl;
        const {
            value,
            tagName: Component = Text,
            className,
            children,
        } = this.props;

        let formattedTime = formatTime(value, this.props);

        if (typeof children === 'function') {
            return children(formattedTime);
        }

        const componentProps = {
            children: formattedTime,
        };
        if (className) {
            Object.assign(componentProps, {className});
        }

        return <Component {...componentProps} />;
    }
}
