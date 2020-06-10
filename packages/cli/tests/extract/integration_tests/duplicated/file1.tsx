import React from 'react';
import {FormattedMessage} from 'react-intl';

export function Foo() {
  return (
    <p>
      <FormattedMessage id="foo" defaultMessage="Foo" />
    </p>
  );
}
