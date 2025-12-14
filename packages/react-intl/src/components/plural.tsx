/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react'
import {FormatPluralOptions} from '@formatjs/intl'
import useIntl from './useIntl.js'

interface Props extends FormatPluralOptions {
  value: number
  other: React.ReactNode
  zero?: React.ReactNode
  one?: React.ReactNode
  two?: React.ReactNode
  few?: React.ReactNode
  many?: React.ReactNode
  children?(value: React.ReactNode): React.ReactElement | null
}

const FormattedPlural: React.FC<Props> = props => {
  const {formatPlural, textComponent: Text} = useIntl()
  const {value, other, children} = props

  const pluralCategory = formatPlural(value, props)
  const formattedPlural = props[pluralCategory as 'one'] || other

  if (typeof children === 'function') {
    return children(formattedPlural)
  }
  if (Text) {
    return <Text>{formattedPlural}</Text>
  }
  // Work around @types/react where React.FC cannot return string
  return formattedPlural as any
}

FormattedPlural.displayName = 'FormattedPlural'

export default FormattedPlural
