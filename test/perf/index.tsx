import {Suite} from 'benchmark';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import {
  IntlProvider,
  FormattedNumber,
  FormattedDate,
  FormattedMessage,
  // FormattedRelativeTime,
} from '../../dist';

const suite = new Suite('renderToString', {
  onCycle: function(e: any) {
    console.log(String(e.target));
  },
});

suite.on('error', function(e: any) {
  console.log(e)
  throw e.target.error;
});

suite.add('<div>', function() {
  ReactDOMServer.renderToString(<div />);
});

suite.add('100 x <div/>', function() {
  const divs = []
  for (let i = 0, len = 100; i < len; i += 1) {
    divs.push(<div key={i}/>)
  }
  ReactDOMServer.renderToString(
    <IntlProvider locale="en">
      {divs}
    </IntlProvider>
  );
});

suite.add('100 x <FormattedNumber>', function() {
  let formattedNumbers = [];
  for (let i = 0, len = 100; i < len; i += 1) {
    formattedNumbers.push(<FormattedNumber value={i} key={i} />);
  }

  ReactDOMServer.renderToString(
    <IntlProvider locale="en">
      {formattedNumbers}
    </IntlProvider>
  );
});

suite.add('100 x <FormattedDate>', function() {
  let now = Date.now();
  let formattedDates = [];
  for (let i = 0, len = 100; i < len; i += 1) {
    formattedDates.push(<FormattedDate value={now - 1000 * 60 * i} key={i} />);
  }

  ReactDOMServer.renderToString(
    <IntlProvider locale="en">
      {formattedDates}
    </IntlProvider>
  );
});

suite.add('100 x <FormattedMessage>', function() {
  let messages: Record<number, string> = {};
  let formattedMessages = [];
  for (let i = 0, len = 100; i < len; i += 1) {
    messages[i] = `message ${i}`;
    formattedMessages.push(<FormattedMessage id={`${i}`} key={i} />);
  }

  ReactDOMServer.renderToString(
    <IntlProvider locale="en" messages={messages}>
      {formattedMessages}
    </IntlProvider>
  );
});

suite.add('100 x <FormattedMessage> with placeholder', function() {
  let messages: Record<number, string> = {};
  let formattedMessages = [];
  for (let i = 0, len = 100; i < len; i += 1) {
    const varName = `var${i}`
    messages[i] = `{${varName}, plural, =0{{${varName}, number} message} =1{{${varName}, number} messages}}`;
    formattedMessages.push(
      <FormattedMessage id={`${i}`} values={{[varName]: i}} key={i} />
    );
  }

  ReactDOMServer.renderToString(
    <IntlProvider locale="en" messages={messages}>
      {formattedMessages}
    </IntlProvider>
  );
});

suite.add('100 x <FormattedMessage> with placeholder, cached', function() {
  let messages: Record<number, string> = {};
  let formattedMessages = [];
  for (let i = 0, len = 100; i < len; i += 1) {
    messages[i] = `{var0, plural, =0{{var0, number} message} =1{{var0, number} messages}}`;
    formattedMessages.push(
      <FormattedMessage id={`${i}`} values={{var0: i}} key={i} />
    );
  }

  ReactDOMServer.renderToString(
    <IntlProvider locale="en" messages={messages}>
      {formattedMessages}
    </IntlProvider>
  );
});

// suite.add('100 x <FormattedRelative>', function() {
//   let formattedRelativeTimes = [];
//   for (let i = 0, len = 100; i < len; i += 1) {
//     formattedRelativeTimes.push(
//       <FormattedRelativeTime value={-60 * i} key={i} />
//     );
//   }

//   ReactDOMServer.renderToString(
//     <IntlProvider locale="en">
//       <div>{formattedRelativeTimes}</div>
//     </IntlProvider>
//   );
// });

suite.run();
