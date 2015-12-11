/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {Component, Children, PropTypes} from 'react';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import IntlPluralFormat from '../plural';
import memoizeIntlConstructor from 'intl-format-cache';
import invariant from 'invariant';
import {shouldIntlComponentUpdate} from '../utils';
import {intlConfigPropTypes, intlFormatPropTypes, intlShape} from '../types';
import * as format from '../format';
import {hasLocaleData} from '../locale-data-registry';

const intlConfigPropNames = Object.keys(intlConfigPropTypes);
const intlFormatPropNames = Object.keys(intlFormatPropTypes);

export default class IntlProvider extends Component {
    constructor(props, context) {
        super(props, context);

        invariant(Intl,
            '[React Intl] The `Intl` APIs must be available in the runtime, ' +
            'and do not appear to be built-in. An `Intl` polyfill should be loaded.\n' +
            'See: http://formatjs.io/guides/runtime-environments/'
        );

        // Used to stabilize time when performing an initial rendering so that
        // all relative times use the same reference "now" time.
        let initialNow;
        if (isFinite(props.initialNow)) {
            initialNow = Number(props.initialNow);
        } else {
            // When an `initialNow` isn't provided via `props`, look to see an
            // <IntlProvider> exists in the ancestry and call its `now()`
            // function to propagate its value for "now".
            initialNow = context.intl ? context.intl.now() : Date.now();
        }

        this.state = {
            // Creating `Intl*` formatters is expensive so these format caches
            // memoize the `Intl*` constructors and have the same lifecycle as
            // this IntlProvider instance.
            getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
            getNumberFormat  : memoizeIntlConstructor(Intl.NumberFormat),
            getMessageFormat : memoizeIntlConstructor(IntlMessageFormat),
            getRelativeFormat: memoizeIntlConstructor(IntlRelativeFormat),
            getPluralFormat  : memoizeIntlConstructor(IntlPluralFormat),

            // Wrapper to provide stable "now" time for initial render.
            now: () => {
                return this._didDisplay ? Date.now() : initialNow;
            },
        };
    }

    getConfig() {
        const {intl: intlContext = {}} = this.context;

        // Build a whitelisted config object from `props` and `context.intl`, if
        // an <IntlProvider> exists in the ancestry.
        let config = intlConfigPropNames.reduce((config, name) => {
            config[name] = this.props[name] || intlContext[name];
            return config;
        }, {});

        if (!hasLocaleData(config.locale)) {
            const {
                locale,
                defaultLocale,
                defaultFormats,
            } = config;

            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[React Intl] Missing locale data for locale: "${locale}". ` +
                    `Using default locale: "${defaultLocale}" as fallback.`
                );
            }

            // Since there's no registered locale data for `locale`, this will
            // fallback to the `defaultLocale` to make sure things can render.
            // The `messages` are overridden to the `defaultProps` empty object
            // to maintain referential equality across re-renders. It's assumed
            // each <FormattedMessage> contains a `defaultMessage` prop.
            config = {
                ...config,
                locale  : defaultLocale,
                formats : defaultFormats,
                messages: IntlProvider.defaultProps.messages,
            };
        }

        return config;
    }

    getBoundFormatFns(config, state) {
        return intlFormatPropNames.reduce((boundFormatFns, name) => {
            boundFormatFns[name] = format[name].bind(null, config, state);
            return boundFormatFns;
        }, {});
    }

    getChildContext() {
        const config = this.getConfig();

        // Bind intl factories and current config to the format functions.
        let boundFormatFns = this.getBoundFormatFns(config, this.state);

        return {
            intl: {
                ...config,
                ...boundFormatFns,
                now: this.state.now,
            },
        };
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    componentDidMount() {
        this._didDisplay = true;
    }

    render() {
        return Children.only(this.props.children);
    }
}

IntlProvider.displayName = 'IntlProvider';

IntlProvider.contextTypes = {
    intl: intlShape,
};

IntlProvider.childContextTypes = {
    intl: intlShape.isRequired,
};

IntlProvider.propTypes = {
    ...intlConfigPropTypes,
    children  : PropTypes.element.isRequired,
    initialNow: PropTypes.any,
};

IntlProvider.defaultProps = {
    formats : {},
    messages: {},

    defaultLocale : 'en',
    defaultFormats: {},
};
