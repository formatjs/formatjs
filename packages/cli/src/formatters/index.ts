import * as defaultFormatter from './default';
import * as transifex from './transifex';

export function resolveBuiltinFormatter(format?: string) {
  if (!format) {
    return defaultFormatter;
  }
  switch (format) {
    case 'transifex':
      return transifex;
  }
  try {
    return require(format);
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`);
    throw e;
  }
}
