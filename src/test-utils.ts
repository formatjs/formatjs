import {createDefaultFormatters, DEFAULT_INTL_CONFIG} from './utils';
import {OptionalIntlConfig, getBoundFormatFns} from './components/provider';
import {IntlShape} from './types';

export function generateIntlContext(config: OptionalIntlConfig): IntlShape {
  const formatters = createDefaultFormatters();
  const resolvedConfig = {...DEFAULT_INTL_CONFIG, ...config};
  return {
    ...resolvedConfig,
    formatters,
    ...getBoundFormatFns(resolvedConfig, formatters),
  };
}
