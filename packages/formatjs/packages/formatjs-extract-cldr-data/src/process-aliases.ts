import { outputFileSync } from 'fs-extra';
import * as aliases from 'cldr-core/supplemental/aliases.json';

const { languageAlias } = aliases.supplemental.metadata.alias;
/**
 * Turn aliases into Record<string, string> using _replacement
 */
export function process(): Record<string, string> {
  return Object.keys(languageAlias).reduce(
    (all: Record<string, string>, locale) => {
      all[locale] = languageAlias[locale as 'zh-CN']._replacement;
      return all;
    },
    {}
  );
}
