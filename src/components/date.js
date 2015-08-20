import {Component, DOM, PropTypes} from 'react';
import {intlContextTypes, dateTimeFormatPropTypes} from '../types';
import {formatDate} from '../format';
import {shouldIntlComponentUpdate} from '../utils';

class FormattedDate extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {intl} = this.context;
        const props  = this.props;

        let formattedDate = formatDate(intl, props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedDate);
        }

        return DOM.span(null, formattedDate);
    }
}

FormattedDate.propTypes = Object.assign({}, dateTimeFormatPropTypes, {
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
});

FormattedDate.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

export default FormattedDate;
