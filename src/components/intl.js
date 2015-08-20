import {Component, PropTypes} from 'react';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import IntlPluralFormat from '../plural';
import createFormatCache from 'intl-format-cache';
import {shouldIntlComponentUpdate} from '../utils';
import {intlPropTypes, intlContextTypes} from '../types';

class IntlProvider extends Component {
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
        const props = this.props;

        let intl =  Object.assign({
            locale        : props.locale,
            formats       : props.formats,
            messages      : props.messages,
            defaultLocale : props.defaultLocale,
            defaultFormats: props.defaultFormats,
        }, this.state);

        return {intl};
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
    intl: PropTypes.shape(intlContextTypes),
};

export default IntlProvider;
