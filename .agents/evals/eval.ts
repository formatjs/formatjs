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

export interface CaseEvaluation {
  id: string
  failures: string[]
}

export function buildPrompt(suite: EvalSuite): string {
  const cases = suite.cases.map(({id, request}) => ({id, request}))

  return [
    `Use /${suite.skill} to handle every case below.`,
    'Treat each case independently. Do not inspect or modify files.',
    'Return only one JSON object with this shape:',
    '{"results":[{"id":"case-id","outcome":"pass|arbitration-needed|blocked","labels":["classification"],"answer":"concise answer"}]}',
    'For localization reviews, use the skill classification names as labels. Use outcome "pass" only when the review passes.',
    'For translations, use outcome "pass" when translation completes. Use "blocked" for malformed source or missing required decisions.',
    'Cases:',
    JSON.stringify(cases),
  ].join('\n')
}

function messageText(content: unknown): string | undefined {
  if (typeof content === 'string') {
    return content
  }
  if (!Array.isArray(content)) {
    return undefined
  }

  const parts = content.flatMap(part => {
    if (typeof part === 'string') {
      return [part]
    }
    if (
      typeof part === 'object' &&
      part !== null &&
      'text' in part &&
      typeof part.text === 'string'
    ) {
      return [part.text]
    }
    return []
  })
  return parts.length > 0 ? parts.join('') : undefined
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

export function parseCopilotOutput(jsonl: string): EvalResponse {
  const messages: string[] = []

  for (const line of jsonl.split('\n')) {
    if (!line.trim()) {
      continue
    }

    let event: unknown
    try {
      event = JSON.parse(line)
    } catch {
      continue
    }

    if (
      typeof event !== 'object' ||
      event === null ||
      !('type' in event) ||
      event.type !== 'assistant.message' ||
      !('data' in event) ||
      typeof event.data !== 'object' ||
      event.data === null ||
      !('content' in event.data)
    ) {
      continue
    }

    const text = messageText(event.data.content)
    if (text) {
      messages.push(text)
    }
  }

  for (const message of messages.reverse()) {
    try {
      const response = parseJsonObject(message)
      assertResponse(response)
      return response
    } catch {
      continue
    }
  }

  throw new Error('Copilot output contained no valid eval response')
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
