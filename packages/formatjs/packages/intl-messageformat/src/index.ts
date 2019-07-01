/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import parser from 'intl-messageformat-parser';
import MessageFormat from './core';

MessageFormat.__parse = parser.parse;

export { Formats, Pattern } from './compiler';
export default MessageFormat;
