import {IntlLocale} from '../src';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
IntlLocale._addLikelySubtagData(data.supplemental.likelySubtags);
// This is different from test262 bc of https://github.com/tc39/test262/issues/2628
const testDataMinimal = {
  // Undefined primary language.
  und: 'und',
  'und-Thai': 'und-Thai',
  'und-419': 'und-419',
  'und-150': 'und-150',
  'und-AT': 'und-AT',

  // https://unicode-org.atlassian.net/browse/ICU-13786
  'aae-Latn-IT': 'aae-Latn-IT',
  'aae-Thai-CO': 'aae-Thai-CO',

  // https://unicode-org.atlassian.net/browse/ICU-10220
  // https://unicode-org.atlassian.net/browse/ICU-12345
  'und-CW': 'und-CW',
  'und-US': 'und',
  'zh-Hant': 'zh-Hant',
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
