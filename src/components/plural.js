import {Component, DOM, PropTypes} from 'react';
import {intlContextTypes, pluralFormatPropTypes} from '../types';
import {formatPlural} from '../format';
import {shouldIntlComponentUpdate} from '../utils';

class FormattedPlural extends Component {
    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    render() {
        const {intl} = this.context;
        const props  = this.props;

        let pluralCategory  = formatPlural(intl, props.value, props);
        let formattedPlural = props[pluralCategory] || props.other;

        if (typeof props.children === 'function') {
            return props.children(formattedPlural);
        }

        return DOM.span(null, formattedPlural);
    }
}

FormattedPlural.propTypes = Object.assign({}, pluralFormatPropTypes, {
    value: PropTypes.any.isRequired,
    other: PropTypes.node.isRequired,
    zero : PropTypes.node,
    one  : PropTypes.node,
    two  : PropTypes.node,
    few  : PropTypes.node,
    many : PropTypes.node,
});

formatPlural.defaultProps = {
    style: 'cardinal',
}

FormattedPlural.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

export default FormattedPlural;
