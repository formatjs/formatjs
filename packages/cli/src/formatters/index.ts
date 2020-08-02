import * as defaultFormatter from './default';
import * as transifex from './transifex';
import * as smartling from './smartling';

export function resolveBuiltinFormatter(format?: string) {
  if (!format) {
    return defaultFormatter;
  }
  switch (format) {
    case 'transifex':
      return transifex;
    case 'smartling':
      return smartling;
  }
  try {
    return require(format);
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`);
    throw e;
  }
}
