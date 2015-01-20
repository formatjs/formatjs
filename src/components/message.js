/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var IntlMessage = React.createClass({
    displayName: 'IntlMessage',
    mixins     : [IntlMixin],

    propTypes: {
        tagName: React.PropTypes.string,
        message: React.PropTypes.string.isRequired
    },

    getDefaultProps: function () {
        return {tagName: 'span'};
    },

    render: function () {
        var props   = this.props;
        var tagName = props.tagName;
        var message = props.message;

        // Creates a token with a random guid that should not be guessible or
        // conflict with other parts of the `message` string.
        var guid     = Math.floor(Math.random() * 0x10000000000).toString(16);
        var token    = '@__ELEMENT_' + guid + '__@';
        var elements = [];

        // Iterates over the `props` to keep track of any React Element values
        // so they can be represented by the `token` as a placeholder when the
        // `message` is formatted. This allows the formatted message to then be
        // broken-up into parts with references to the React Elements inserted
        // back in.
        var values = Object.keys(props).reduce(function (values, name) {
            var value = props[name];

            if (React.isValidElement(value)) {
                values[name] = token;
                elements.push(value);
            } else {
                values[name] = value;
            }

            return values;
        }, {});

        // Formats the `message` with the `values`, including the `token`
        // placeholders for React Element values. Then the message is split into
        // parts on each `token` sub-string.
        var formattedMessage      = this.formatMessage(message, values);
        var formattedMessageParts = formattedMessage.split(token);

        // Using the formatted message's parts, an array of child React Elements
        // is constructed so that React's virtual diffing can work properly. The
        // React Elements that were put aside above are now inserted back into
        // position so that React can render the message with any nested React
        // Elements properly.
        var children = formattedMessageParts.reduce(function (parts, part, i) {
            if (part) {
                parts.push(part);
            }

            var element = elements[i];
            if (element) {
                parts.push(element);
            }

            return parts;
        }, []);

        var elementArgs = [tagName, null].concat(children);
        return React.createElement.apply(null, elementArgs);
    }
});

export default IntlMessage;
