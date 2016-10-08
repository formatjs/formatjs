/*global expect*/

import React from 'react';
import createComponentWithIntl from '../../utils/createComponentWithIntl';
import App from '../App';

test('app should be rendered', () => {
    const component = createComponentWithIntl(<App/>);

    let tree = component.toJSON();

    expect(tree).toMatchSnapshot();
});
