/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import 'intl-pluralrules'

export default class IntlPluralFormat {
  constructor(locales, options = {}) {
    this.formatter = new Intl.PluralRules(locales, options)
  }
  format = value => this.formatter.select(value)
}
