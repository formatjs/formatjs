import { ErrorKind } from './error';
import {Parser} from './parser';

export function parse(message: string) {
    const result = new Parser(message, {}).parse();
    if (result.val) {
        return result.val;
    }
    const error = Error(ErrorKind[result.err.kind]);
    // @ts-expect-error Assign to error object
    error.location = result.err.location;
    throw error;
}
