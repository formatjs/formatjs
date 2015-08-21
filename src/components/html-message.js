import {Component, PropTypes, createElement} from 'react';
import {intlContextTypes} from '../types';
import {formatHTMLMessage} from '../format';
import {shallowEquals, shouldIntlComponentUpdate} from '../utils';

class FormattedHTMLMessage extends Component {
    shouldComponentUpdate(nextProps, ...next) {
        const values     = this.props.values;
        const nextValues = nextProps.values;

        if (!shallowEquals(nextValues, values)) {
            return true;
        }

        return shouldIntlComponentUpdate(this,
            Object.assign({}, nextProps, {values: null}),
            ...next
        );
    }

    render() {
        const {intl} = this.context;
        const props  = this.props;

        let {
            id,
            description,
            defaultMessage,
            values,
            tagName,
        } = props;

        let descriptor           = {id, description, defaultMessage};
        let formattedHTMLMessage = formatHTMLMessage(intl, descriptor, values);

        if (typeof props.children === 'function') {
            return props.children(formattedHTMLMessage);
        }

        // Since the message presumably has HTML in it, we need to set
        // `innerHTML` in order for it to be rendered and not escaped by React.
        // To be safe, all string prop values were escaped before formatting the
        // message. It is assumed that the message is not UGC, and came from the
        // developer making it more like a template.
        //
        // Note: There's a perf impact of using this component since there's no
        // way for React to do its virtual DOM diffing.
        return createElement(tagName, {
            dangerouslySetInnerHTML: {
                __html: formattedHTMLMessage,
            },
        });
    }
}

FormattedHTMLMessage.propTypes = {
    id            : PropTypes.string,
    description   : PropTypes.string,
    defaultMessage: PropTypes.string,

    values : PropTypes.object,
    tagName: PropTypes.string,
};

FormattedHTMLMessage.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

FormattedHTMLMessage.defaultProps = {
    tagName: 'span',
    values : {},
};

export default FormattedHTMLMessage;
