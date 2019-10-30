import enforceDescription from './rules/enforce-description';
import noCamelCase from './rules/no-camel-case';
import noEmoji from './rules/no-emoji';
import noMultiplePlurals from './rules/no-multiple-plurals';
import noOffset from './rules/no-offset';
import blacklistElements from './rules/blacklist-elements';
const plugin = {
  rules: {
    'enforce-description': enforceDescription,
    'no-camel-case': noCamelCase,
    'no-emoji': noEmoji,
    'no-multiple-plurals': noMultiplePlurals,
    'no-offset': noOffset,
    'blacklist-elements': blacklistElements,
  },
};

export type Plugin = typeof plugin;

module.exports = plugin;
