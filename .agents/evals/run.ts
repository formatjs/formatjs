import {spawnSync} from 'node:child_process'
import {
  appendFileSync,
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
  EVAL_RESPONSE_SCHEMA,
  evaluateSuite,
  parseEvalResponse,
  type CaseEvaluation,
} from './eval.ts'

interface Args extends minimist.ParsedArgs {
  suite?: string
  skill?: string
  codex?: string
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
  const skillPath = path.resolve(args.skill)
  const skillName = path.basename(path.dirname(skillPath))
  if (suite.skill !== skillName) {
    throw new Error(
      `suite targets ${suite.skill}, but skill path targets ${skillName}`
    )
  }

  const workdir = mkdtempSync(
    path.join(tmpdir(), `formatjs-skill-eval-${suite.skill}-`)
  )
  const responsePath = path.join(workdir, 'response.json')
  const schemaPath = path.join(workdir, 'response-schema.json')
  const skillInstructions = readFileSync(skillPath, 'utf8')
  writeFileSync(
    schemaPath,
    `${JSON.stringify(EVAL_RESPONSE_SCHEMA, null, 2)}\n`
  )

  try {
    const codexArgs = [
      'exec',
      '--json',
      '--ephemeral',
      '--skip-git-repo-check',
      '--ignore-user-config',
      '--ignore-rules',
      '--disable',
      'shell_tool',
      '--disable',
      'skill_search',
      '--disable',
      'memories',
      '--disable',
      'plugins',
      '--disable',
      'apps',
      '--disable',
      'browser_use',
      '--disable',
      'computer_use',
      '--sandbox',
      'read-only',
      '--output-schema',
      schemaPath,
      '--output-last-message',
      responsePath,
    ]
    if (args.model) {
      codexArgs.push('--model', args.model)
    }
    codexArgs.push(buildPrompt(suite, skillInstructions))

    const result = spawnSync(args.codex || 'codex', codexArgs, {
      cwd: workdir,
      encoding: 'utf8',
      env: process.env,
    })

    if (result.error) {
      throw new Error(
        `Could not start Codex binary ${args.codex || 'codex'}: ${result.error.message}. Pass --codex=/path/to/codex.`
      )
    }

    if (args.transcript) {
      const transcript = path.resolve(args.transcript)
      mkdirSync(path.dirname(transcript), {recursive: true})
      writeFileSync(transcript, result.stdout)
    }

    if (result.status !== 0) {
      throw new Error(
        `Codex exited ${result.status ?? 'without status'}: ${(result.stderr || '').trim()}`
      )
    }

    const response = parseEvalResponse(readFileSync(responsePath, 'utf8'))
    const evaluations = evaluateSuite(suite, response)
    writeSummary(
      args.summary,
      suite.skill,
      args.model || 'Codex account default',
      evaluations
    )

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
