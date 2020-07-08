import {FormattedMessage, injectIntl, useIntl} from 'react-intl';

import React from 'react';

function myFunction(param1, {formatMessage, formatDate}) {
  return (
    formatMessage({
      id: 'inline1',
      defaultMessage: 'Hello params!',
      description: 'A stateless message',
    }) + formatDate(new Date())
  );
}

const child = myFunction(filterable, intl);

function SFC() {
  const {formatMessage} = useIntl();
  return formatMessage({
    id: 'hook',
    defaultMessage: 'hook <b>foo</b>',
    description: 'hook',
  });
}

const Foo = ({intl: {formatMessage}}) => {
  const msgs = {
    qux: formatMessage({
      id: 'foo.bar.quux',
      defaultMessage: 'Hello <b>Stateless!</b>',
      description: 'A stateless message',
    }),
  };

  return (
    <div>
      <h1>{msgs.header}</h1>
      <p>{msgs.content}</p>
      <span>
        <FormattedMessage id="foo" defaultMessage="bar" description="baz" />
      </span>
    </div>
  );
};

export default injectIntl(Foo);
