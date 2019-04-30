import expect from 'expect';
import React from 'react';
import {mount} from 'enzyme';

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

        const renderWithIntlProvider = (Element, providerProps) => mount(
          <IntlProvider locale='en' {...providerProps}>
            { Element }
          </IntlProvider>
        );

        it('formats dates', () => {
            const date = new Date();
            const el = <FormattedDate id='test' value={date} month='numeric' />;

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe(String(date.getMonth() + 1));
        });

        it('formats times', () => {
            const date = new Date();
            const el   = <FormattedTime id='test' value={date} />;

            const hours   = date.getHours();
            const minutes = date.getMinutes();

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe(
              `${hours > 12 ? (hours % 12) : (hours || '12')}:` +
              `${minutes < 10 ? `0${minutes}` : minutes} ` +
              `${hours < 12 ? 'AM' : 'PM'}`
            );
        });

        it('formats dates relative to "now"', () => {
            const now = Date.now();
            const el  = <FormattedRelative id='test' value={now - 1000} initialNow={now} />;

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe('1 second ago');
        });

        it('formats numbers with thousands separators', () => {
            const el = <FormattedNumber id='test' value={1000} />;

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe('1,000');
        });

        it('formats numbers with decimal separators', () => {
            const el = <FormattedNumber id='test' value={0.1} minimumFractionDigits={2} />;

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe('0.10');
        });

        it('pluralizes labels in strings', () => {
            const el = (
              <FormattedMessage
                id='test'
                defaultMessage='You have {emails, plural, one {# email} other {# emails}}.'
                values={{
                  emails: 1000
                }}
              />
            );

            const rendered = renderWithIntlProvider(el).find('#test > span');
            expect(rendered.text()).toBe('You have 1,000 emails.');
        });
    });
}
