import {FormattedMessage, injectIntl} from 'react-intl';

import React from 'react';

const Foo = ({intl: {formatMessage}}) => {
  const msgs = {
    qux: formatMessage({
      id: 'foo.bar.quux',
      defaultMessage: 'Hello Stateless!',
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
