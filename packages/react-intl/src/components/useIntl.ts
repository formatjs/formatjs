import * as React from 'react'
import {type IntlShape} from '#packages/react-intl/src/types.js'
import {invariantIntlContext} from '#packages/react-intl/src/utils.js'
import {Context} from '#packages/react-intl/src/components/context.js'

export default function useIntl(this: void): IntlShape {
  const intl = React.useContext(Context)
  invariantIntlContext(intl)
  return intl
}
