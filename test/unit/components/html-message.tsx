import * as React from 'react';
import {mountFormattedComponentWithProvider} from '../testUtils';
import FormattedHTMLMessage from '../../../src/components/html-message';
import {createIntl} from '../../../src/components/provider';
import {mount} from 'enzyme';

const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedHTMLMessage
);

describe('<FormattedHTMLMessage>', () => {
  let intl;

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
      defaultLocale: 'en-US',
      textComponent: 'span',
    });
  });

  it('has a `displayName`', () => {
    expect(FormattedHTMLMessage.displayName).toBeA('string');
  });

  it('should throw if intl is not provided', function() {
    expect(() => mount(<FormattedHTMLMessage id="foo" />)).toThrow(
      /Could not find required `intl` object./
    );
  });

  it('should use textComponent if tagName is ""', function() {
    intl = createIntl({
      locale: 'en',
      defaultLocale: 'en-US',
      textComponent: 'p',
    });
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>World</b>!',
      tagName: '',
    };

    const rendered = mountWithProvider(descriptor, intl).find('p');

    expect(rendered.prop('dangerouslySetInnerHTML')).toEqual({
      __html: intl.formatHTMLMessage(descriptor),
    });
  });

  it('should use span if textComponent & tagName is undefined', function() {
    intl = createIntl({
      locale: 'en',
      defaultLocale: 'en-US',
      textComponent: undefined,
    });
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>World</b>!',
      tagName: undefined,
    };

    const rendered = mountWithProvider(descriptor, intl).find('span');

    expect(rendered.prop('dangerouslySetInnerHTML')).toEqual({
      __html: intl.formatHTMLMessage(descriptor),
    });
  });

  it('renders a formatted HTML message in a <span>', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>World</b>!',
    };

    const rendered = mountWithProvider(descriptor, intl).find('span');

    expect(rendered.prop('dangerouslySetInnerHTML')).toEqual({
      __html: intl.formatHTMLMessage(descriptor),
    });
  });

  it('accepts `values` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>{name}</b>!',
    };
    const values = {name: 'Eric'};

    const rendered = mountWithProvider({...descriptor, values}, intl).find(
      'span'
    );

    expect((rendered.prop('dangerouslySetInnerHTML') as any).__html).toBe(
      intl.formatHTMLMessage(descriptor, values)
    );
  });

  it('should HTML-escape `values`', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>{name}</b>!',
    };
    const values = {name: '<i>Eric</i>'};

    const rendered = mountWithProvider({...descriptor, values}, intl).find(
      'span'
    );

    expect((rendered.prop('dangerouslySetInnerHTML') as any).__html).toBe(
      'Hello, <b>&lt;i&gt;Eric&lt;/i&gt;</b>!'
    );
  });

  it('accepts `tagName` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>World</b>!',
    };
    const tagName = 'p';

    const rendered = mountWithProvider({...descriptor, tagName}, intl).find(
      tagName
    );

    expect(rendered.type()).toEqual(tagName);
  });

  it('supports function-as-child pattern', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, <b>World</b>!',
    };

    const spy = jest.fn().mockImplementation(() => <p>Jest</p>);
    const rendered = mountWithProvider({...descriptor, children: spy}, intl);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatHTMLMessage(descriptor)]);

    expect(rendered.text()).toBe('Jest');
  });

  it('does not support rich-text message formatting', () => {
    const renderedHtml = mountWithProvider(
      {
        id: 'hello',
        defaultMessage: 'Hello, <b>{name}</b>!',
        values: {
          name: <i>Eric</i>,
        },
      },
      intl
    ).html();

    expect(renderedHtml).not.toBe('<span>Hello, <b><i>Eric</i></b>!</span>');
  });
});
