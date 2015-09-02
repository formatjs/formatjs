import {Component, DOM, PropTypes} from 'react';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedTime extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatTime} = this.context;
        const props        = this.props;

        let formattedTime = formatTime(props.value, props);

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
    intl: intlShape.isRequired,
};
