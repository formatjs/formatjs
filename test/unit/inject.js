import expect from 'expect';
import React from 'react';
import injectIntl from '../../src/inject';

describe('injectIntl()', () => {
    it('allows introspection access to the wrapped component', () => {
        const wrapped  = React.createElement('div');
        const injected = injectIntl(wrapped);

        expect(injected.WrappedComponent).toBe(wrapped);
    });
});
