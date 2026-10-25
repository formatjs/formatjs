import {loadNative} from '#packages/cli-lib/native.js'

export interface EvaluationSpan {
  start: number
  end: number
}

export interface EvaluatedString extends EvaluationSpan {
  value: string
}

/** Evaluate requested expressions using OXC's semantic analysis and constant evaluator. */
export function evaluateStrings(
  source: string,
  filename: string,
  spans: EvaluationSpan[]
): EvaluatedString[] {
  return loadNative().evaluateStrings(source, filename, spans)
}
