import {spawnSync} from 'node:child_process'
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import minimist from 'minimist'
import {
  assertSuite,
  buildPrompt,
  evaluateSuite,
  parseCopilotOutput,
  type CaseEvaluation,
} from './eval.ts'

interface Args extends minimist.ParsedArgs {
  suite: string
  skill: string
  copilot?: string
  model?: string
  transcript?: string
  summary?: string
}

function annotationValue(value: string): string {
  return value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
}

function writeSummary(
  summaryPath: string | undefined,
  skill: string,
  model: string,
  evaluations: CaseEvaluation[]
) {
  if (!summaryPath) {
    return
  }

  const rows = evaluations.map(({id, failures}) => {
    const result = failures.length === 0 ? 'pass' : failures.join('; ')
    return `| \`${id}\` | ${result} |`
  })
  appendFileSync(
    summaryPath,
    [
      `## ${skill} eval`,
      '',
      `Model: \`${model}\``,
      '',
      '| Case | Result |',
      '| --- | --- |',
      ...rows,
      '',
    ].join('\n')
  )
}

function main(args: Args) {
  if (!args.suite || !args.skill) {
    throw new Error('--suite and --skill are required')
  }

  const suite = JSON.parse(readFileSync(path.resolve(args.suite), 'utf8'))
  assertSuite(suite)
  if (suite.skill !== path.basename(args.skill)) {
    throw new Error(
      `suite targets ${suite.skill}, but skill path targets ${path.basename(args.skill)}`
    )
  }

  const model = args.model || process.env.COPILOT_MODEL || 'claude-sonnet-4.6'
  const workdir = mkdtempSync(
    path.join(tmpdir(), `formatjs-skill-eval-${suite.skill}-`)
  )
  const skillDestination = path.join(workdir, '.agents', 'skills', suite.skill)
  mkdirSync(path.dirname(skillDestination), {recursive: true})
  cpSync(path.resolve(args.skill), skillDestination, {recursive: true})

  try {
    const result = spawnSync(
      args.copilot || 'copilot',
      [
        '--no-auto-update',
        '--no-custom-instructions',
        '--disable-builtin-mcps',
        '--no-ask-user',
        '--no-remote',
        '--no-remote-export',
        '--output-format=json',
        '--available-tools=skill',
        '--allow-all-tools',
        `--model=${model}`,
        '--max-ai-credits=2',
        '-p',
        buildPrompt(suite),
      ],
      {
        cwd: workdir,
        encoding: 'utf8',
        env: {
          ...process.env,
          COPILOT_HOME: path.join(workdir, '.copilot'),
        },
      }
    )

    if (args.transcript) {
      const transcript = path.resolve(args.transcript)
      mkdirSync(path.dirname(transcript), {recursive: true})
      writeFileSync(transcript, result.stdout)
    }

    if (result.status !== 0) {
      throw new Error(
        `Copilot exited ${result.status ?? 'without status'}: ${result.stderr.trim()}`
      )
    }

    const response = parseCopilotOutput(result.stdout)
    const evaluations = evaluateSuite(suite, response)
    writeSummary(args.summary, suite.skill, model, evaluations)

    let failed = false
    for (const evaluation of evaluations) {
      if (evaluation.failures.length === 0) {
        console.log(`PASS ${evaluation.id}`)
        continue
      }

      failed = true
      const message = evaluation.failures.join('; ')
      console.error(`FAIL ${evaluation.id}: ${message}`)
      if (process.env.GITHUB_ACTIONS === 'true') {
        console.error(
          `::error title=Skill eval ${annotationValue(evaluation.id)}::${annotationValue(message)}`
        )
      }
    }

    if (failed) {
      process.exitCode = 1
    }
  } finally {
    rmSync(workdir, {recursive: true, force: true})
  }
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
