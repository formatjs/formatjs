import * as IcuMessageFormatParser from '@formatjs/icu-messageformat-parser'
import IntlMessageFormat from 'intl-messageformat'
import React from 'react'
import * as ReactIntl from 'react-intl'

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...ReactIntl,
  IntlMessageFormat,
  IcuMessageFormatParser,
  intl: ReactIntl.createIntl({
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
  }),
}

export default ReactLiveScope
