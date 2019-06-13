import * as React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedPlural from '../../../src/components/plural';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/plural')
);

describe('<FormattedPlural>', () => {
    let consoleError;
    let intl;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error');
        intl = generateIntlContext({
          locale: 'en'
        });
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it('has a `displayName`', () => {
        expect(FormattedPlural.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const FormattedPlural = mockContext();
        expect(() => shallowDeep(<FormattedPlural />, 2)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders an empty <span> when no `other` prop is provided', () => {
        const FormattedPlural = mockContext(intl);

        const rendered = shallowDeep(
          <FormattedPlural />,
          2
        );
        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe('');

        const renderedWithValue = shallowDeep(
          <FormattedPlural value={1} />,
          2
        );
        expect(renderedWithValue.type()).toBe('span');
        expect(renderedWithValue.text()).toBe('');
    });

    it('renders `other` in a <span> when no `value` prop is provided', () => {
        const FormattedPlural = mockContext(intl);
        const other = 'Jest';

        const rendered = shallowDeep(
          <FormattedPlural other={other} />,
          2
        );
        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(other);
    });

    it('renders a formatted plural in a <span>', () => {
        const FormattedPlural = mockContext(intl);
        const num = 1;
        const one = 'foo';
        const other = 'bar';

        const rendered = shallowDeep(
          <FormattedPlural value={num} one={one} other={other} />,
          2
        );
        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(
          num === 1
            ? one
            : other
        );
    });


    it('should re-render when props change', () => {
        const FormattedPlural = mockContext(intl);

        const spy = jest.fn().mockImplementation(() => null)
        const withInlContext = mount(
          <FormattedPlural value={0} one='foo' other='bar'>
            { spy }
          </FormattedPlural>
        );

        withInlContext.setProps({
          ...withInlContext.props(),
          value: withInlContext.prop('value') + 1
        });

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when context changes', () => {
        const FormattedPlural = mockContext(intl);

        const spy = jest.fn().mockImplementation(() => null)
        const withInlContext = mount(
          <FormattedPlural value={0} one='foo' other='bar'>
            { spy }
          </FormattedPlural>
        );

        const otherIntl = generateIntlContext({
          locale: 'en-US'
        });
        withInlContext.instance().mockContext(otherIntl);

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('accepts valid IntlPluralFormat options as props', () => {
        const FormattedPlural = mockContext(intl);
        const num = 22;
        const props = {two: 'nd'};
        const options = {type: 'ordinal'};

        const rendered = shallowDeep(
          <FormattedPlural value={num} {...props} {...options} />,
          2
        );

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(
          props[intl.formatPlural(num, options)]
        );
    });

    it('supports function-as-child pattern', () => {
        const FormattedPlural = mockContext(intl);
        const props = {one: 'foo'};
        const num = 1;

        const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
        const rendered = shallowDeep(
          <FormattedPlural {...props} value={num}>
            { spy }
          </FormattedPlural>,
          2
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0]).toEqual([
          props[intl.formatPlural(num)]
        ]);

        expect(rendered.type()).toBe('b');
        expect(rendered.text()).toBe('Jest');
    });
});
