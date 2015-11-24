import expect from 'expect';
import * as ReactIntl from '../../src/react-intl';
import React from 'react';

describe('injectIntl', () => {
    it('allows introspection access to the wrapped component', () => {
        const wrapped = React.createElement('div', 'hello');
        const injected = ReactIntl.injectIntl(wrapped);
        expect(injected.WrappedComponent).toBe(wrapped);
    });
});
