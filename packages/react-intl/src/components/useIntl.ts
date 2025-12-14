import * as React from 'react'
import {IntlShape} from '../types.js'
import {invariantIntlContext} from '../utils.js'
import {Context} from './injectIntl.js'

export default function useIntl(this: void): IntlShape {
  const intl = React.useContext(Context)
  invariantIntlContext(intl)
  return intl
}
