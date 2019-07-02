/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import parser from 'intl-messageformat-parser';
import IntlMessageFormat from './core';

IntlMessageFormat.__parse = parser.parse;

export { Formats, Pattern } from './compiler';
export * from './core';
export { Formatters } from './compiler';
export default IntlMessageFormat;
