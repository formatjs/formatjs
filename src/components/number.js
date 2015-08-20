import {Component, DOM, PropTypes} from 'react';
import {intlContextTypes, numberFormatPropTypes} from '../types';
import {formatNumber} from '../format';
import {shouldIntlComponentUpdate} from '../utils';

class FormattedNumber extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {intl} = this.context;
        const props  = this.props;

        let formattedNumber = formatNumber(intl, props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedNumber);
        }

        return DOM.span(null, formattedNumber);
    }
}

FormattedNumber.propTypes = Object.assign({}, numberFormatPropTypes, {
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
});

FormattedNumber.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

export default FormattedNumber;
