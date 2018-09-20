/*global expect*/

import React from 'react';
import createComponentWithIntl from '../../utils/createComponentWithIntl';
import AppHeader from '../AppHeader';

test('app header should be rendered', () => {
    const component = createComponentWithIntl(<AppHeader/>);

    let tree = component.toJSON();

    expect(tree).toMatchSnapshot();
});
