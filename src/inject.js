/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component} from 'react';
import {intlShape} from './types';
import {assertIntlContext} from './utils';

function getDisplayName(Component) {
    return Component.displayName || Component.name || 'Component';
}

export default function injectIntl(WrappedComponent, options = {}) {
    const {intlPropName = 'intl'} = options;

    class InjectIntl extends Component {
        constructor(props, context) {
            super(props, context);
            assertIntlContext(context);
        }

        render() {
            return (
                <WrappedComponent
                    {...this.props}
                    {...{[intlPropName]: this.context.intl}}
                    ref='wrappedElement'
                />
            );
        }
    }

    InjectIntl.displayName = `IntjectIntl(${getDisplayName(WrappedComponent)})`;

    InjectIntl.contextTypes = {
        intl: intlShape,
    };

    return InjectIntl;
}
