import './polyfill';
import {Locale} from '.';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
const PolyfilledLocale = (Intl as any).Locale as typeof Locale;
if (typeof PolyfilledLocale._addLikelySubtagData === 'function') {
  PolyfilledLocale._addLikelySubtagData(data.supplemental.likelySubtags);
}
