export type EvalOutcome = 'pass' | 'arbitration-needed' | 'blocked'

export interface EvalExpectation {
  outcome: EvalOutcome
  labelsInclude?: string[]
  labelsExclude?: string[]
  answerIncludes?: string[]
  answerExcludes?: string[]
}

export interface EvalCase {
  id: string
  request: string
  expect: EvalExpectation
}

export interface EvalSuite {
  skill: string
  cases: EvalCase[]
}

export interface EvalResult {
  id: string
  outcome: EvalOutcome
  labels: string[]
  answer: string
}

export interface EvalResponse {
  results: EvalResult[]
}

export const EVAL_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'outcome', 'labels', 'answer'],
        properties: {
          id: {type: 'string'},
          outcome: {
            type: 'string',
            enum: ['pass', 'arbitration-needed', 'blocked'],
          },
          labels: {type: 'array', items: {type: 'string'}},
          answer: {type: 'string'},
        },
      },
    },
  },
} as const

export interface CaseEvaluation {
  id: string
  failures: string[]
}

export function buildPrompt(
  suite: EvalSuite,
  skillInstructions: string
): string {
  const cases = suite.cases.map(({id, request}) => ({id, request}))

  return [
    `Follow only the embedded ${suite.skill} skill instructions below.`,
    'Do not invoke other skills or tools. Treat each case independently.',
    'Return only one JSON object with this shape:',
    '{"results":[{"id":"case-id","outcome":"pass|arbitration-needed|blocked","labels":["classification"],"answer":"concise answer"}]}',
    'For localization reviews, use the skill classification names as labels. Use outcome "pass" only when the review passes; use "arbitration-needed" whenever any finding remains, including a blocked finding.',
    'For translations, use outcome "pass" when translation completes. Use "blocked" for malformed source or missing required decisions.',
    'Skill instructions:',
    skillInstructions,
    'Cases:',
    JSON.stringify(cases),
  ].join('\n')
}

function parseJsonObject(text: string): unknown {
  const unfenced = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')
  if (start === -1 || end < start) {
    throw new Error('assistant response did not contain a JSON object')
  }
  return JSON.parse(unfenced.slice(start, end + 1))
}

function assertResponse(value: unknown): asserts value is EvalResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('results' in value) ||
    !Array.isArray(value.results)
  ) {
    throw new Error('assistant JSON must contain a results array')
  }

  for (const result of value.results) {
    if (
      typeof result !== 'object' ||
      result === null ||
      !('id' in result) ||
      typeof result.id !== 'string' ||
      !('outcome' in result) ||
      !['pass', 'arbitration-needed', 'blocked'].includes(
        String(result.outcome)
      ) ||
      !('labels' in result) ||
      !Array.isArray(result.labels) ||
      !result.labels.every((label: unknown) => typeof label === 'string') ||
      !('answer' in result) ||
      typeof result.answer !== 'string'
    ) {
      throw new Error('assistant result has invalid shape')
    }
  }
}

export function parseEvalResponse(text: string): EvalResponse {
  const response = parseJsonObject(text)
  assertResponse(response)
  return response
}

function missingValues(actual: string[], expected: string[]): string[] {
  return expected.filter(value => !actual.includes(value))
}

function includedValues(actual: string[], forbidden: string[]): string[] {
  return forbidden.filter(value => actual.includes(value))
}

export function evaluateSuite(
  suite: EvalSuite,
  response: EvalResponse
): CaseEvaluation[] {
  return suite.cases.map(testCase => {
    const failures: string[] = []
    const matches = response.results.filter(result => result.id === testCase.id)
    if (matches.length !== 1) {
      failures.push(`expected one result, received ${matches.length}`)
      return {id: testCase.id, failures}
    }

    const result = matches[0]
    const expectation = testCase.expect
    if (result.outcome !== expectation.outcome) {
      failures.push(
        `expected outcome ${expectation.outcome}, received ${result.outcome}`
      )
    }

    const missingLabels = missingValues(
      result.labels,
      expectation.labelsInclude || []
    )
    if (missingLabels.length > 0) {
      failures.push(`missing labels: ${missingLabels.join(', ')}`)
    }

    const forbiddenLabels = includedValues(
      result.labels,
      expectation.labelsExclude || []
    )
    if (forbiddenLabels.length > 0) {
      failures.push(`forbidden labels: ${forbiddenLabels.join(', ')}`)
    }

    const answer = result.answer.toLocaleLowerCase('en-US')
    const missingAnswer = (expectation.answerIncludes || []).filter(
      value => !answer.includes(value.toLocaleLowerCase('en-US'))
    )
    if (missingAnswer.length > 0) {
      failures.push(`answer missing: ${missingAnswer.join(', ')}`)
    }

    const forbiddenAnswer = (expectation.answerExcludes || []).filter(value =>
      answer.includes(value.toLocaleLowerCase('en-US'))
    )
    if (forbiddenAnswer.length > 0) {
      failures.push(`answer included forbidden: ${forbiddenAnswer.join(', ')}`)
    }

    return {id: testCase.id, failures}
  })
}

export function assertSuite(value: unknown): asserts value is EvalSuite {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('skill' in value) ||
    typeof value.skill !== 'string' ||
    !/^[a-z0-9-]+$/.test(value.skill) ||
    !('cases' in value) ||
    !Array.isArray(value.cases) ||
    value.cases.length === 0
  ) {
    throw new Error('eval suite has invalid shape')
  }

  const ids = new Set<string>()
  for (const testCase of value.cases) {
    if (
      typeof testCase !== 'object' ||
      testCase === null ||
      !('id' in testCase) ||
      typeof testCase.id !== 'string' ||
      !('request' in testCase) ||
      typeof testCase.request !== 'string' ||
      !('expect' in testCase) ||
      typeof testCase.expect !== 'object' ||
      testCase.expect === null ||
      !('outcome' in testCase.expect) ||
      !['pass', 'arbitration-needed', 'blocked'].includes(
        String(testCase.expect.outcome)
      )
    ) {
      throw new Error('eval case has invalid shape')
    }
    if (ids.has(testCase.id)) {
      throw new Error(`duplicate eval case id: ${testCase.id}`)
    }
    ids.add(testCase.id)
  }
}
