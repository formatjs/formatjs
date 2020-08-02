import * as defaultFormatter from './default';
import * as transifex from './transifex';
import * as smartling from './smartling';
import * as simple from './simple';
import * as lokalise from './lokalise';
import * as crowdin from './crowdin';

export function resolveBuiltinFormatter(format?: string) {
  if (!format) {
    return defaultFormatter;
  }
  switch (format) {
    case 'transifex':
      return transifex;
    case 'smartling':
      return smartling;
    case 'simple':
      return simple;
    case 'lokalise':
      return lokalise;
    case 'crowdin':
      return crowdin;
  }
  try {
    return require(format);
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`);
    throw e;
  }
}
