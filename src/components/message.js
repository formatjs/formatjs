import {Component, PropTypes, createElement, isValidElement} from 'react';
import {intlContextTypes} from '../types';
import {formatMessage} from '../format';
import {shallowEquals, shouldIntlComponentUpdate} from '../utils';

class FormattedMessage extends Component {
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

        // Creates a token with a random guid that should not be guessable or
        // conflict with other parts of the `message` string.
        let guid = Math.floor(Math.random() * 0x10000000000).toString(16);
        let tokenRegexp = new RegExp(`(@__ELEMENT-${guid}-\\d+__@)`, 'g');

        let generateToken = (() => {
            let counter = 0;
            return () => `@__ELEMENT-${guid}-${counter += 1}__@`;
        })();

        let tokenizedValues = {};
        let elements        = {};

        // Iterates over the `props` to keep track of any React Element values
        // so they can be represented by the `token` as a placeholder when the
        // `message` is formatted. This allows the formatted message to then be
        // broken-up into parts with references to the React Elements inserted
        // back in.
        Object.keys(values).forEach((name) => {
            let value = values[name];

            if (isValidElement(value)) {
                let token = generateToken();
                tokenizedValues[name] = token;
                elements[token]       = value;
            } else {
                tokenizedValues[name] = value;
            }
        });

        let descriptor       = {id, description, defaultMessage};
        let formattedMessage = formatMessage(intl, descriptor, tokenizedValues);

        // Split the message into parts so the React Element values captured
        // above can be inserted back into the rendered message. This approach
        // allows messages to render with React Elements while keeping React's
        // virtual diffing working properly.
        let nodes = formattedMessage
            .split(tokenRegexp)
            .filter((part) => !!part)
            .map((part) => elements[part] || part);

        if (typeof props.children === 'function') {
            return props.children(...nodes);
        }

        return createElement(tagName, null, ...nodes);
    }
}

FormattedMessage.propTypes = {
    id            : PropTypes.string.isRequired,
    description   : PropTypes.string,
    defaultMessage: PropTypes.string,

    values : PropTypes.object,
    tagName: PropTypes.string,
};

FormattedMessage.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

FormattedMessage.defaultProps = {
    tagName: 'span',
    values : {},
};

export default FormattedMessage;
