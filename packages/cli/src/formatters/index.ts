import * as defaultFormatter from './default';
import * as transifex from './transifex';
import * as smartling from './smartling';
import * as simple from './simple';
import * as lokalise from './lokalise';
import * as crowdin from './crowdin';
import {resolve} from 'path';
export async function resolveBuiltinFormatter(format?: string) {
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
    return import(resolve(process.cwd(), format));
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`);
    throw e;
  }
}
