import {MessageDescriptor} from './types';

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

type Messages<Names extends keyof any = string> = {
  [key in Names]: MessageDescriptor;
};

export default function defineMessages<Names extends keyof any>(
  messageDescriptors: Messages<Names>
) {
  // This simply returns what's passed-in because it's meant to be a hook for
  // babel-plugin-react-intl.
  return messageDescriptors;
}
