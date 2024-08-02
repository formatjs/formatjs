import * as React from 'react'
import {IntlShape} from '../types'
import {invariantIntlContext} from '../utils'
import {Context} from './injectIntl'

export default function useIntl(this: void): IntlShape {
  const intl = React.useContext(Context)
  invariantIntlContext(intl)
  return intl
}
