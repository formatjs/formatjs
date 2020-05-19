import './polyfill';
import {IntlLocale} from '.';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
const PolyfilledLocale = (Intl as any).Locale as typeof IntlLocale;
if (typeof PolyfilledLocale._addLikelySubtagData === 'function') {
  PolyfilledLocale._addLikelySubtagData(data.supplemental.likelySubtags);
}
