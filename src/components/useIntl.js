import {useContext} from 'react';
import {IntlContext} from './../react-intl';
import {invariantIntlContext} from '../utils';

export default function useIntl() {
  const intl = useContext(IntlContext);
  invariantIntlContext({ intl });
  return [intl.formatMessage,  intl];
}
