import expect from 'expect';
import * as ReactIntl from '../../src/react-intl';
import * as ReactIntlWL from '../../src/index';

describe('react-intl-with-locales', () => {
    describe('exports', () => {
        it('has the same exports as "react-intl"', () => {
            Object.keys(ReactIntl).forEach((namedExport) => {
                expect(ReactIntlWL[namedExport]).toBe(ReactIntl[namedExport]);
            });
        });
    });
});
