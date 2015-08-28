import {Component, DOM, PropTypes} from 'react';
import {intlContextTypes, relativeFormatPropTypes} from '../types';
import {shouldIntlComponentUpdate} from '../utils';

export default class FormattedRelative extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {formatRelative} = this.context.intl;
        const props            = this.props;

        let formattedRelative = formatRelative(props.value, props);

        if (typeof props.children === 'function') {
            return props.children(formattedRelative);
        }

        return DOM.span(null, formattedRelative);
    }
}

FormattedRelative.propTypes = Object.assign({}, relativeFormatPropTypes, {
    format: PropTypes.string,
    value : PropTypes.any.isRequired,
    now   : PropTypes.any,
});

FormattedRelative.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};
