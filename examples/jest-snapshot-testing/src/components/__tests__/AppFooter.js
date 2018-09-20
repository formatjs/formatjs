/*global expect*/

import React from 'react';
import createComponentWithIntl from '../../utils/createComponentWithIntl';
import AppFooter from '../AppFooter';

test('app footer should be rendered', () => {
    const component = createComponentWithIntl(<AppFooter/>);

    let tree = component.toJSON();

    expect(tree).toMatchSnapshot();
});
