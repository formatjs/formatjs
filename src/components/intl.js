import {Component, PropTypes} from 'react';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import IntlPluralFormat from '../plural';
import createFormatCache from 'intl-format-cache';
import {shouldIntlComponentUpdate} from '../utils';
import {intlContextTypes} from '../types';
import * as format from '../format';

function bindFormatFns(intl, localeData) {
    return Object.keys(intlContextTypes).reduce((types, name) => {
        types[name] = format[name].bind(null, intl, localeData);
        return types;
    }, {});
}

export default class IntlProvider extends Component {
    constructor(props) {
        super(props);

        this.state = {
            getDateTimeFormat: createFormatCache(Intl.DateTimeFormat),
            getNumberFormat  : createFormatCache(Intl.NumberFormat),
            getMessageFormat : createFormatCache(IntlMessageFormat),
            getRelativeFormat: createFormatCache(IntlRelativeFormat),
            getPluralFormat  : createFormatCache(IntlPluralFormat),
        };
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    getChildContext() {
        const intl       = this.state;
        const localeData = this.props;

        // Reduce intl + localeData to just the format functions.
        return {intl: bindFormatFns(intl, localeData)};
    }

    render() {
        const {children} = this.props;

        if (typeof children === 'function') {
            // TODO: Pass the result of `this.getChildContext()` to the child fn?
            // Or just `Object.assign({}, this.props, this.state)`? Or nothing!?
            // Passing stuff would expose the underlying info and make it part
            // of the public API.
            return children();
        }

        return children;
    }
}

IntlProvider.propTypes = {
    locale  : PropTypes.string,
    formats : PropTypes.object,
    messages: PropTypes.object,

    defaultLocale : PropTypes.string,
    defaultFormats: PropTypes.object,
};

IntlProvider.defaultProps = {
    // TODO: Should `locale` default to 'en'? Or would that cause issues with
    // the meaning of no-locale, which means the user's default.
    formats : {},
    messages: {},

    defaultLocale : 'en',
    defaultFormats: {},
};

IntlProvider.childContextTypes = {
    intl: PropTypes.shape(intlContextTypes),
};
