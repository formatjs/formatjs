import {Component} from 'react';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import IntlPluralFormat from '../plural';
import createFormatCache from 'intl-format-cache';
import {shouldIntlComponentUpdate} from '../utils';
import {intlPropTypes, intlFormatPropTypes, intlShape} from '../types';
import * as format from '../format';

const intlPropNames       = Object.keys(intlPropTypes);
const intlFormatPropNames = Object.keys(intlFormatPropTypes);

export default class IntlProvider extends Component {
    constructor(props) {
        super(props);

        // Creating `Intl*` formatters is expensive so these format caches
        // memoize the `Intl*` constructors and have the same lifecycle as this
        // IntlProvider instance.
        this.state = {
            getDateTimeFormat: createFormatCache(Intl.DateTimeFormat),
            getNumberFormat  : createFormatCache(Intl.NumberFormat),
            getMessageFormat : createFormatCache(IntlMessageFormat),
            getRelativeFormat: createFormatCache(IntlRelativeFormat),
            getPluralFormat  : createFormatCache(IntlPluralFormat),
        };
    }

    getConfig(props = this.props) {
        return intlPropNames.reduce((config, name) => {
            config[name] = props[name];
            return config;
        }, {});
    }

    getBoundFormatFns(intl, config) {
        return intlFormatPropNames.reduce((boundFormatFns, name) => {
            boundFormatFns[name] = format[name].bind(null, intl, config);
            return boundFormatFns;
        }, {});
    }

    getChildContext() {
        const intl   = this.state;
        const config = this.getConfig();

        // Bind intl factories and current config to the format functions.
        let boundFormatFns = this.getBoundFormatFns(intl, config);

        return {
            intl: {
                ...config,
                ...boundFormatFns,
            },
        };
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {children} = this.props;

        if (typeof children === 'function') {
            // TODO: Pass the result of `this.getChildContext()` to the child fn?
            // Or just `{...this.props, ...this.state}`? Or nothing!? Passing
            // stuff would expose the underlying info and make it part of the
            // public API.
            return children();
        }

        return children;
    }
}

IntlProvider.propTypes = intlPropTypes;

IntlProvider.defaultProps = {
    // TODO: Should `locale` default to 'en'? Or would that cause issues with
    // the meaning of no-locale, which means the user's default.
    formats : {},
    messages: {},

    defaultLocale : 'en',
    defaultFormats: {},
};

IntlProvider.childContextTypes = {
    intl: intlShape.isRequired,
};
