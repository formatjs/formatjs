import {IParseOptions} from './src/parser';
import {Options} from './src/types';
export * from './src/types';

export type ParseOptions = Options & IParseOptions;

export function parse() {
  throw new Error(
    "You're trying to format an uncompiled message with react-intl without parser, please import from 'react-int' instead"
  );
}
