import {Component, DOM, PropTypes} from 'react';
import {intlContextTypes, dateTimeFormatPropTypes} from '../types';
import {formatTime} from '../format';
import {shouldIntlComponentUpdate} from '../utils';

class FormattedTime extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {intl} = this.context;
        const props  = this.props;

        let formattedTime = formatTime(intl, props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedTime);
        }

        return DOM.span(null, formattedTime);
    }
}

FormattedTime.propTypes = Object.assign({}, dateTimeFormatPropTypes, {
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
});

FormattedTime.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

export default FormattedTime;
