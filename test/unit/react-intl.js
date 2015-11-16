import expect from 'expect';
import * as ReactIntl from '../../src/react-intl';

describe('react-intl', () => {
    describe('exports', () => {
        it('exports `addLocaleData`', () => {
            expect(ReactIntl.addLocaleData).toBeA('function');
        });

        it('exports `defineMessages`', () => {
            expect(ReactIntl.defineMessages).toBeA('function');
        });

        it('exports `injectIntl`', () => {
            expect(ReactIntl.injectIntl).toBeA('function');
        });

        describe('React Components', () => {
            it('exports `IntlProvider`', () => {
                expect(ReactIntl.IntlProvider).toBeA('function');
            });

            it('exports `FormattedDate`', () => {
                expect(ReactIntl.FormattedDate).toBeA('function');
            });

            it('exports `FormattedTime`', () => {
                expect(ReactIntl.FormattedTime).toBeA('function');
            });

            it('exports `FormattedRelative`', () => {
                expect(ReactIntl.FormattedRelative).toBeA('function');
            });

            it('exports `FormattedNumber`', () => {
                expect(ReactIntl.FormattedNumber).toBeA('function');
            });

            it('exports `FormattedPlural`', () => {
                expect(ReactIntl.FormattedPlural).toBeA('function');
            });

            it('exports `FormattedMessage`', () => {
                expect(ReactIntl.FormattedMessage).toBeA('function');
            });

            it('exports `FormattedHTMLMessage`', () => {
                expect(ReactIntl.FormattedHTMLMessage).toBeA('function');
            });
        });

        describe('PropTypes Definitions', () => {
            it('exports `intlShape`', () => {
                expect(ReactIntl.intlShape).toBeAn('function');
            });
        });
    });
});
