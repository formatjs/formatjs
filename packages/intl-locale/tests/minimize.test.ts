import {IntlLocale} from '../src';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
IntlLocale._addLikelySubtagData(data.supplemental.likelySubtags);
const testDataMinimal = {
  // Undefined primary language.
  und: 'en',
  'und-Thai': 'th',
  'und-419': 'es-419',
  'und-150': 'ru-150',
  'und-AT': 'de-AT',

  // https://unicode-org.atlassian.net/browse/ICU-13786
  'aae-Latn-IT': 'aae-Latn-IT',
  'aae-Thai-CO': 'aae-Thai-CO',

  // https://unicode-org.atlassian.net/browse/ICU-10220
  // https://unicode-org.atlassian.net/browse/ICU-12345
  'und-CW': 'pap-CW',
  'und-US': 'en',
  'zh-Hant': 'zh-TW',
  'zh-Hani': 'zh-Hani',
};

describe('minimize', function() {
  for (const [tag, minimal] of Object.entries(testDataMinimal)) {
    it(`${minimal} is indeed minimal`, function() {
      // Assert the |minimal| tag is indeed minimal.
      expect(new IntlLocale(minimal).minimize().toString()).toBe(minimal);
    });
    it(`${tag} -> ${minimal}`, function() {
      // Assert RemoveLikelySubtags(tag) returns |minimal|.
      expect(new IntlLocale(tag).minimize().toString()).toBe(minimal);
    });
  }
});
