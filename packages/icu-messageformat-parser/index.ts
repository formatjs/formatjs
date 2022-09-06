import {ErrorKind} from './error'
import {Parser, ParserOptions} from './parser'
import {
  isDateElement,
  isDateTimeSkeleton,
  isNumberElement,
  isNumberSkeleton,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  MessageFormatElement,
} from './types'

function pruneLocation(els: MessageFormatElement[]): void {
  els.forEach(el => {
    delete el.location
    if (isSelectElement(el) || isPluralElement(el)) {
      for (const k in el.options) {
        delete el.options[k].location
        pruneLocation(el.options[k].value)
      }
    } else if (isNumberElement(el) && isNumberSkeleton(el.style)) {
      delete el.style.location
    } else if (
      (isDateElement(el) || isTimeElement(el)) &&
      isDateTimeSkeleton(el.style)
    ) {
      delete el.style.location
    } else if (isTagElement(el)) {
      pruneLocation(el.children)
    }
  })
}

export function parse(message: string, opts: ParserOptions = {}) {
  opts = {
    shouldParseSkeletons: true,
    requiresOtherClause: true,
    ...opts,
  }
  const result = new Parser(message, opts).parse()
  if (result.err) {
    const error = SyntaxError(ErrorKind[result.err.kind])
    // @ts-expect-error Assign to error object
    error.location = result.err.location
    // @ts-expect-error Assign to error object
    error.originalMessage = result.err.message
    throw error
  }

  if (!opts?.captureLocation) {
    pruneLocation(result.val)
  }
  return result.val
}
export * from './types'
// only for testing
export const _Parser = Parser
