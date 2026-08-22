import {describe, expect, it} from 'vitest'
import {
  assertSuite,
  buildPrompt,
  evaluateSuite,
  parseCopilotOutput,
  type EvalSuite,
} from './eval.js'

const SUITE: EvalSuite = {
  skill: 'localization-review',
  cases: [
    {
      id: 'date-range',
      request: 'Review a manually formatted date range.',
      expect: {
        outcome: 'arbitration-needed',
        labelsInclude: ['deterministic-error'],
        answerIncludes: ['FormattedDateTimeRange'],
      },
    },
  ],
}

describe('skill eval harness', () => {
  it('keeps hidden expectations out of the model prompt', () => {
    const prompt = buildPrompt(SUITE)
    expect(prompt).toContain('Review a manually formatted date range.')
    expect(prompt).not.toContain('FormattedDateTimeRange')
    expect(prompt).not.toContain('deterministic-error')
  })

  it('parses the last assistant JSON message', () => {
    const output = [
      JSON.stringify({type: 'assistant.message', data: {content: 'thinking'}}),
      JSON.stringify({
        type: 'assistant.message',
        data: {
          content: JSON.stringify({
            results: [
              {
                id: 'date-range',
                outcome: 'arbitration-needed',
                labels: ['deterministic-error'],
                answer: 'Use FormattedDateTimeRange.',
              },
            ],
          }),
        },
      }),
    ].join('\n')

    expect(parseCopilotOutput(output).results[0].id).toBe('date-range')
  })

  it('reports deterministic expectation failures', () => {
    const evaluations = evaluateSuite(SUITE, {
      results: [
        {
          id: 'date-range',
          outcome: 'pass',
          labels: [],
          answer: 'Looks fine.',
        },
      ],
    })

    expect(evaluations[0].failures).toEqual([
      'expected outcome arbitration-needed, received pass',
      'missing labels: deterministic-error',
      'answer missing: FormattedDateTimeRange',
    ])
  })

  it('rejects duplicate case ids', () => {
    expect(() =>
      assertSuite({
        ...SUITE,
        cases: [SUITE.cases[0], SUITE.cases[0]],
      })
    ).toThrow('duplicate eval case id')
  })
})
