import * as React from 'react';
import {Context} from './injectIntl';
import {invariantIntlContext} from '../utils';
import {IntlShape} from '../types';

export default function useIntl(): IntlShape {
  const intl = React.useContext(Context);
  invariantIntlContext(intl);
  return intl;
}
