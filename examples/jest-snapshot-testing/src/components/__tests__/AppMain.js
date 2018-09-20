/*global expect*/

import React from 'react';
import createComponentWithIntl from '../../utils/createComponentWithIntl';
import AppMain from '../AppMain';

test('app main should be rendered', () => {
    const component = createComponentWithIntl(<AppMain/>);

    let tree = component.toJSON();

    expect(tree).toMatchSnapshot();

    tree.props.onClick();

    tree = component.toJSON();

    expect(tree).toMatchSnapshot();
});
