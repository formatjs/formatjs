import expect from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from 'react-addons-test-utils';

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
        let intlProvider;

        beforeEach(() => {
            renderer = createRenderer();
            intlProvider = new IntlProvider({ locale: 'en' }, {});
        });

        it('formats dates', () => {
            const date = new Date();
            const el = <FormattedDate value={date} month="numeric" />;

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>{date.getMonth() + 1}</span>
            );
        });

        it('formats times', () => {
            const date = new Date();
            const el = <FormattedTime value={date} />;

            const hours = date.getHours();
            const minutes = date.getMinutes();

            renderer.render(el, intlProvider.getChildContext());
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
            const el = <FormattedRelative value={now - 1000} initialNow={now} />;

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>1 second ago</span>
            );
        });

        it('formats numbers with thousands separators', () => {
            const el = <FormattedNumber value={1000} />;

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>1,000</span>
            );
        });

        it('formats numbers with decimal separators', () => {
            const el = <FormattedNumber value={0.1} minimumFractionDigits={2} />;

            renderer.render(el, intlProvider.getChildContext());
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

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>You have 1,000 emails.</span>
            );
        });
        it('pluralizes one value in strings', () => {
            const el = (
                <FormattedMessage
                    id="num_emails"
                    defaultMessage="You have {emails, plural, one {# email} other {# emails}}."
                    values={{
                        emails: 1,
                    }}
                    />
            );

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>You have 1 email.</span>
            );
        });
        it('pluralizes zero value in strings', () => {
            const el = (
                <FormattedMessage
                    id="num_emails"
                    defaultMessage="You have {emails, plural, =0 {no} one {one} other {many} } email."
                    values={{
                        emails: 0,
                    }}
                    />
            );

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>You have no email.</span>
            );
        });
           it('pluralizes other value in strings', () => {
            const el = (
                <FormattedMessage
                    id="num_emails"
                    defaultMessage="You have {emails, plural, =0 {zero} one {one} other {an unusual amount of} } email."
                    values={{
                        emails: "lots",
                    }}
                    />
            );

            renderer.render(el, intlProvider.getChildContext());
            expect(renderer.getRenderOutput()).toEqualJSX(
                <span>You have an unsual amount of email.</span>
            );
        });
    });
}
