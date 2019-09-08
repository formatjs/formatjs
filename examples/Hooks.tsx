import * as React from 'react';
import {IntlProvider} from '../';

import {useIntl} from '../';

interface Props {}

const messages = {
  simple: 'Hello world',
  placeholder: 'Hello {name}',
  date: 'Hello {ts, date}',
  time: 'Hello {ts, time}',
  number: 'Hello {num, number}',
  plural: 'I have {num, plural, one {# dog} other {# dogs}}',
  select: 'I am a {gender, select, male {boy} female {girl}}',
  selectordinal: `I am the {order, selectordinal,
        one {#st person}
        two {#nd person}
        =3 {#rd person}
        other {#th person}
    }`,
  richtext: 'I have <bold>{num, plural, one {# dog} other {# dogs}}</bold>',
  richertext:
    'I have & < &nbsp; <bold>{num, plural, one {# & dog} other {# dogs}}</bold>',
  unicode: 'Hello\u0020{placeholder}',
};

/**
 * @NOTE
 *
 * `<IntlProvider>` needs to exist in the component ancestry
 * BEFORE using the `useIntl()` hook,
 * as shown in the `App` component below
 *
 * ```js
 * interface Props {}
 *
 * const Wrapper: React.FC<Props> = (props) => {
 * 	return (
 *    <IntlProvider locale="en" messages={messages}>
 *      <Hooks {...props} />
 *    </IntlProvider>
 *   );
 * };
 * ```
 *
 */
const Hooks: React.FC<Props> = () => {
  const intl = useIntl();
  const {formatMessage: f} = intl;

  return (
    <>
      <p>
        {/* <FormattedMessage id="simple" /> */}
        {f({id: 'simple'})}
        <br />
        {/* <FormattedMessage id="placeholder" values={{name: 'John'}} /> */}
        {f({id: 'placeholder'}, {name: 'John'})}
        <br />
        {/* <FormattedMessage id="date" values={{ts: Date.now()}} /> */}
        {f({id: 'date'}, {ts: Date.now()})}
        <br />
        {/* <FormattedMessage id="time" values={{ts: Date.now()}} /> */}
        {f({id: 'time'}, {ts: Date.now()})}
        <br />
        {/* <FormattedMessage id="number" values={{num: Math.random() * 1000}} /> */}
        {f({id: 'number'}, {num: Math.random() * 1000})}
        <br />
        {/* <FormattedMessage id="plural" values={{num: 1}} /> */}
        {f({id: 'plural'}, {num: 1})}
        <br />
        {/* <FormattedMessage id="plural" values={{num: 99}} /> */}
        {f({id: 'plural'}, {num: 99})}
        <br />
        {/* <FormattedMessage id="select" values={{gender: 'male'}} /> */}
        {f({id: 'select'}, {gender: 'male'})}
        <br />
        {/* <FormattedMessage id="select" values={{gender: 'female'}} /> */}
        {f({id: 'select'}, {gender: 'female'})}
        <br />
        {f({id: 'selectordinal'}, {order: 1})}
        <br />
        {/* <FormattedMessage id="selectordinal" values={{order: 2}} /> */}
        {f({id: 'selectordinal'}, {order: 2})}
        <br />
        {/* <FormattedMessage id="selectordinal" values={{order: 3}} /> */}
        {f({id: 'selectordinal'}, {order: 3})}
        <br />
        {/* <FormattedMessage id="selectordinal" values={{order: 4}} /> */}
        {f({id: 'selectordinal'}, {order: 4})}
        <br />
        {/* <FormattedMessage
          id="richtext"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
        /> */}
        {f(
          {id: 'richtext'},
          {num: 99, bold: (...chunks) => <strong key={0}>{chunks}</strong>}
        )}
        <br />
        {/* <FormattedMessage
          id="richertext"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
        /> */}
        {f(
          {id: 'richertext'},
          {num: 99, bold: (...chunks) => <strong key={0}>{chunks}</strong>}
        )}
        <br />
        {/* <FormattedMessage
          id="random"
          defaultMessage="I have < &nbsp; <bold>{num, plural, one {# dog} other {# & dogs}}</bold>"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
		/> */}
        {f(
          {
            id: 'random',
            defaultMessage:
              'I have < &nbsp; <bold>{num, plural, one {# dog} other {# & dogs}}</bold>',
          },
          {num: 99, bold: (...chunks) => <strong key={0}>{chunks}</strong>}
        )}
        <br />
        {/* <FormattedMessage id="unicode" values={{placeholder: 'world'}} /> */}
        {f({id: 'unicode'}, {placeholder: 'world'})}
        <br />
        {/* <FormattedMessage
          id="whatever"
          defaultMessage="Hello\u0020{placeholder}"
          values={{placeholder: 'world'}}
		/> */}
        {f(
          {id: 'whatever', defaultMessage: 'Hello\u0020{placeholder}'},
          {placeholder: 'world'}
        )}
      </p>
    </>
  );
};

Hooks.defaultProps = {
  currentTime: new Date(),
};

const App: React.FC<Props> = props => {
  return (
    <IntlProvider locale="en" messages={messages}>
      <Hooks {...props} />
    </IntlProvider>
  );
};

export default App;
