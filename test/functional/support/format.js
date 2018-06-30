import expect from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';

expect.extend(expectJSX);

export default function (ReactIntl) {
    describe('format', () => {
        const {
            IntlProvider,
            FormattedDate,
            FormattedTime,
            FormattedRelative,
            FormattedNumber,
            FormattedMessage,
        } = ReactIntl;

        let renderer;
        const renderWithIntlProvider = (Element, providerProps) => renderer.render(
          <IntlProvider locale='en' {...providerProps}>
            { Element }
          </IntlProvider>
        );

        beforeEach(() => {
            renderer     = createRenderer();
        });

        it('formats dates', () => {
            const date = new Date();
            const el   = <FormattedDate value={date} month="numeric" />;

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>{date.getMonth() + 1}</span>
            );
        });

        it('formats times', () => {
            const date = new Date();
            const el   = <FormattedTime value={date} />;

            const hours   = date.getHours();
            const minutes = date.getMinutes();

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>
                    {
                        `${hours > 12 ? (hours % 12) : (hours || '12')}:` +
                        `${minutes < 10 ? `0${minutes}` : minutes} ` +
                        `${hours < 12 ? 'AM' : 'PM'}`
                    }
                </span>
            );
        });

        it('formats dates relative to "now"', () => {
            const now = Date.now();
            const el  = <FormattedRelative value={now - 1000} initialNow={now} />;

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>1 second ago</span>
            );
        });

        it('formats numbers with thousands separators', () => {
            const el = <FormattedNumber value={1000} />;

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>1,000</span>
            );
        });

        it('formats numbers with decimal separators', () => {
            const el = <FormattedNumber value={0.1} minimumFractionDigits={2} />;

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>0.10</span>
            );
        });

        it('pluralizes labels in strings', () => {
            const el = (
                <FormattedMessage
                    id="num_emails"
                    defaultMessage="You have {emails, plural, one {# email} other {# emails}}."
                    values={{
                        emails: 1000,
                    }}
                />
            );

            renderWithIntlProvider(el);
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>You have 1,000 emails.</span>
            );
        });
    });
}
