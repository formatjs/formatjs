import {useContext} from 'react';
import {Context} from './injectIntl';
import {invariantIntlContext} from '../utils';

export default function useIntl() {
  const intl = useContext(Context);
  invariantIntlContext(intl);
  return intl;
}
