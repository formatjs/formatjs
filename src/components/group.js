import {Component, PropTypes, cloneElement, isValidElement} from 'react';

class Group extends Component {
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
    children: PropTypes.func.isRequired
};

export default Group;
