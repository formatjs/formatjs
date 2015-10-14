/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import defaultLocaleData from './en';
import {addLocaleData} from './locale-data-registry';

addLocaleData(defaultLocaleData);

export {addLocaleData};
export {intlShape} from './types';
export {default as injectIntl} from './inject';

export {default as IntlProvider} from './components/intl';
export {default as FormattedDate} from './components/date';
export {default as FormattedTime} from './components/time';
export {default as FormattedRelative} from './components/relative';
export {default as FormattedNumber} from './components/number';
export {default as FormattedPlural} from './components/plural';
export {default as FormattedMessage} from './components/message';
export {default as FormattedHTMLMessage} from './components/html-message';

export function defineMessages(messageDescriptors) {
    // This simply returns what's passed-in because it's meant to be a hook for
    // babel-plugin-react-intl.
    return messageDescriptors;
}
