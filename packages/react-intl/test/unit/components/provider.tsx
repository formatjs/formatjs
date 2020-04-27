import * as React from 'react';
import {mount} from 'enzyme';
import IntlProvider, {
  OptionalIntlConfig,
} from '../../../src/components/provider';
import {WithIntlProps} from '../../../src/components/injectIntl';
import {IntlShape} from '../../../src/types';
import withIntl from '../../../src/components/injectIntl';

describe('<IntlProvider>', () => {
  const now = Date.now();

  const INTL_CONFIG_PROP_NAMES = [
    'locale',
    'timeZone',
    'formats',
    'textComponent',
    'messages',
    'defaultLocale',
    'defaultFormats',
    'onError',
  ];
  const INTL_FORMAT_PROP_NAMES = [
    'formatDate',
    'formatTime',
    'formatRelativeTime',
    'formatNumber',
    'formatPlural',
    'formatMessage',
  ];

  class Child extends React.Component<any> {
    render() {
      return <>{'foo'}</>;
    }
  }

  const IntlChild = withIntl(Child);

  let dateNow;

  beforeEach(() => {
    dateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    dateNow.mockRestore();
  });

  it('has a `displayName`', () => {
    expect(typeof IntlProvider.displayName).toBe('string');
  });

  it('warns when no `locale` prop is provided', () => {
    const onError = jest.fn();
    mount(
      <IntlProvider locale={undefined} onError={onError}>
        <IntlChild />
      </IntlProvider>
    );

    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('warns when `locale` prop provided has no locale data in Intl.NumberFormat', () => {
    const locale = 'missing';
    const onError = jest.fn();
    mount(
      <IntlProvider locale={locale} onError={onError}>
        <IntlChild />
      </IntlProvider>
    );

    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('warns when `locale` prop provided has no locale data in Intl.DateTimeFormat', () => {
    const locale = 'xx-HA';
    const onError = jest.fn();
    const supportedLocalesOf = Intl.NumberFormat.supportedLocalesOf;
    Intl.NumberFormat.supportedLocalesOf = (): string[] => ['xx-HA'];
    mount(
      <IntlProvider locale={locale} onError={onError}>
        <IntlChild />
      </IntlProvider>
    );

    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
    Intl.NumberFormat.supportedLocalesOf = supportedLocalesOf;
  });

  it('renders its `children`', () => {
    const el = (
      <IntlProvider locale="en">
        <IntlChild />
      </IntlProvider>
    );

    const rendered = mount(el);
    expect(rendered.children().length).toBe(1);
    expect(rendered.children().contains(<IntlChild />)).toBe(true);
  });

  it('provides `context.intl` with values from intl config props', () => {
    const props: WithIntlProps<OptionalIntlConfig> = {
      locale: 'fr-FR',
      timeZone: 'UTC',
      formats: {},
      messages: {},
      textComponent: 'span',

      defaultLocale: 'en-US',
      defaultFormats: {},

      onError: jest.fn(),
    };

    const rendered = mount(
      <IntlProvider {...props}>
        <IntlChild />
      </IntlProvider>
    );

    const intl = rendered.find(Child).prop('intl');

    INTL_CONFIG_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).toBe(props[propName]);
    });
  });

  it('provides `context.intl` with timeZone from intl config props when it is specified', () => {
    const props = {
      locale: 'en',
      timeZone: 'Europe/Paris',
    };

    const intl: IntlShape = mount(
      <IntlProvider {...props}>
        <IntlChild />
      </IntlProvider>
    )
      .find(Child)
      .prop('intl');
    expect(intl.timeZone).toBe('Europe/Paris');
  });

  it('provides `context.intl` with values from `defaultProps` for missing or undefined props', () => {
    const props = {
      locale: 'en-US',
      defaultLocale: undefined,
    };

    const intl: IntlShape = mount(
      <IntlProvider {...props}>
        <IntlChild />
      </IntlProvider>
    )
      .find(Child)
      .prop('intl');

    expect(intl.defaultLocale).not.toBe(undefined);
    expect(intl.defaultLocale).toBe('en');
    expect(intl.messages).not.toBe(undefined);
    expect(typeof intl.messages).toBe('object');
  });

  it('provides `context.intl` with format methods bound to intl config props', () => {
    const intl: IntlShape = mount(
      <IntlProvider
        locale="en"
        formats={{
          date: {
            'year-only': {
              year: 'numeric',
            },
          },
        }}
      >
        <IntlChild />
      </IntlProvider>
    )
      .find(Child)
      .prop('intl');

    INTL_FORMAT_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).toBeDefined();
      expect(typeof intl[propName]).toBe('function');
    });

    const date = new Date();
    const df = new Intl.DateTimeFormat('en', {year: 'numeric'});

    expect(intl.formatDate(date, {format: 'year-only'})).toBe(df.format(date));
  });

  it('shadows inherited intl config props from an <IntlProvider> ancestor', () => {
    const onError = jest.fn();
    const props = {
      locale: 'en',
      timeZone: 'Australia/Adelaide',
      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      messages: {
        hello: 'Hello, World!',
      },

      defaultLocale: 'fr',
      defaultFormats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      onError,
    };

    const parentContext: IntlShape = mount(
      <IntlProvider {...props}>
        <IntlChild />
      </IntlProvider>
    )
      .find(Child)
      .prop('intl');

    const intl: IntlShape = mount(
      <IntlProvider
        locale="fr"
        timeZone="Atlantic/Azores"
        formats={{}}
        messages={{}}
        defaultLocale="en"
        defaultFormats={{}}
        textComponent="span"
      >
        <IntlChild />
      </IntlProvider>,
      {context: parentContext}
    )
      .find(Child)
      .prop('intl');

    expect(onError).not.toHaveBeenCalled();

    INTL_CONFIG_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).not.toBe(props[propName]);
    });
  });
});
