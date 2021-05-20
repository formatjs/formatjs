/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import * as ReactIntl from 'react-intl'
import IntlMessageFormat from 'intl-messageformat'
import * as IcuMessageFormatParser from '@formatjs/icu-messageformat-parser'
import '@formatjs/intl-locale/polyfill'
// Our live code demo depends on `Intl.DisplayNames`, which isn't available as of Firefox 81.
import '@formatjs/intl-displaynames/polyfill'
import '@formatjs/intl-displaynames/locale-data/en'

import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en'

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
