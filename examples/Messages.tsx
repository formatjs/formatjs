import * as React from 'react';
import {IntlProvider, FormattedMessage} from '../';

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
};

const App: React.FC<Props> = () => {
  return (
    <IntlProvider locale="en" messages={messages}>
      <p>
        <FormattedMessage id="simple" />
        <br />
        <FormattedMessage id="placeholder" values={{name: 'John'}} />
        <br />
        <FormattedMessage id="date" values={{ts: Date.now()}} />
        <br />
        <FormattedMessage id="time" values={{ts: Date.now()}} />
        <br />
        <FormattedMessage id="number" values={{num: Math.random() * 1000}} />
        <br />
        <FormattedMessage id="plural" values={{num: 1}} />
        <br />
        <FormattedMessage id="plural" values={{num: 99}} />
        <br />
        <FormattedMessage id="select" values={{gender: 'male'}} />
        <br />
        <FormattedMessage id="select" values={{gender: 'female'}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 1}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 2}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 3}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 4}} />
        <br />
        <FormattedMessage
          id="richtext"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
        />
        <br />
        <FormattedMessage
          id="richertext"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
        />
        <br />
        <FormattedMessage
          id="random"
          defaultMessage="I have < &nbsp; <bold>{num, plural, one {# dog} other {# & dogs}}</bold>"
          values={{num: 99, bold: (...chunks) => <strong>{chunks}</strong>}}
        />
      </p>
    </IntlProvider>
  );
};

App.defaultProps = {
  currentTime: new Date(),
};

export default App;
