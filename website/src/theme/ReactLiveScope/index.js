/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import * as ReactIntl from 'react-intl'
import IntlMessageFormat from 'intl-messageformat'
import * as IntlMessageFormatParser from 'intl-messageformat-parser'

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...ReactIntl,
  IntlMessageFormat,
  IntlMessageFormatParser,
  intl: ReactIntl.createIntl({
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
  }),
}

export default ReactLiveScope
