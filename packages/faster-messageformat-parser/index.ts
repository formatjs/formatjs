import {ErrorKind} from './src/error'
import {Parser} from './src/parser'

export function parse(message: string) {
  const result = new Parser(message, {}).parse()
  if (result.val) {
    return result.val
  }
  const error = Error(ErrorKind[result.err.kind])
  // @ts-expect-error Assign to error object
  error.location = result.err.location
  throw error
}
