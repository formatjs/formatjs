/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import { parse } from 'intl-messageformat-parser';
import IntlMessageFormat from './core';

IntlMessageFormat.__parse = parse;

export * from './formatters';
export * from './core';
export default IntlMessageFormat;
