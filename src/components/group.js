/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {Component, PropTypes, cloneElement, isValidElement} from 'react';

export default class Group extends Component {
    render() {
        const props = this.props;

        let renderDelegate = Object.keys(props)
            .filter((prop) => isValidElement(props[prop]))
            .reduceRight((renderDelegate, prop) => {
                return (nodes = {}) => {
                    return cloneElement(props[prop], null, (node) => {
                        nodes[prop] = node;
                        return renderDelegate(nodes);
                    });
                };
            }, props.children);

        return renderDelegate();
    }
}

Group.propTypes = {
    children: PropTypes.func.isRequired,
};
