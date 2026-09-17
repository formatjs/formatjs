import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {basename, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const yarn = resolve(process.argv[2])
const project = mkdtempSync(
  join(process.env.TEST_TMPDIR || tmpdir(), 'calendar-yarn-')
)
const packages = [
  'intl-datetimeformat',
  'intl-datetimeformat-calendar-hebrew',
  'intl-datetimeformat-calendar-japanese',
  'intl-datetimeformat-calendar-chinese',
  'bigdecimal',
  'intl-localematcher',
  'fast-memoize',
]
try {
  const manifests = new Map(
    packages.map(name => [
      name,
      JSON.parse(
        readFileSync(
          new URL(`../../${name}/pkg/package.json`, import.meta.url),
          'utf8'
        )
      ),
    ])
  )
  const resolutions = {}
  for (const name of packages) {
    const directory = join(project, 'archives', name)
    mkdirSync(directory, {recursive: true})
    const source = fileURLToPath(new URL(`../../${name}/pkg/`, import.meta.url))
    cpSync(source, join(directory, 'package'), {
      recursive: true,
      dereference: true,
      filter: path => basename(path) !== 'package.json',
    })
    const manifest = manifests.get(name)
    // Match release.yml: replace workspace ranges with published versions.
    for (const field of [
      'dependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      for (const dependency of Object.keys(manifest[field] || {})) {
        if (manifest[field][dependency].startsWith('workspace:')) {
          manifest[field][dependency] = manifests.get(
            dependency.replace('@formatjs/', '')
          ).version
        }
      }
    }
    writeFileSync(
      join(directory, 'package/package.json'),
      JSON.stringify(manifest)
    )
    execFileSync('tar', [
      '-czf',
      join(project, `${name}.tgz`),
      '-C',
      directory,
      'package',
    ])
    resolutions[manifest.name] = `file:./${name}.tgz`
  }
  writeFileSync(
    join(project, '.formatjs-yarnrc.yml'),
    'enableGlobalCache: false\nenableNetwork: false\nenableTelemetry: false\nenableScripts: false\ncompressionLevel: 0\nnodeLinker: node-modules\ntaskPoolConcurrency: 1\n'
  )
  const run = args =>
    execFileSync(process.execPath, [yarn, ...args], {
      cwd: project,
      encoding: 'utf8',
      timeout: 180000,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            ([name]) => !name.startsWith('YARN_')
          )
        ),
        YARN_RC_FILENAME: '.formatjs-yarnrc.yml',
        YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  for (const addons of [false, true]) {
    const dependencies = {
      '@formatjs/intl-datetimeformat':
        resolutions['@formatjs/intl-datetimeformat'],
    }
    if (addons) {
      for (const name of packages.filter(name => name.includes('-calendar-'))) {
        dependencies[`@formatjs/${name}`] = resolutions[`@formatjs/${name}`]
      }
    }
    writeFileSync(
      join(project, 'package.json'),
      JSON.stringify({
        name: 'calendar-install-smoke',
        private: true,
        dependencies,
        resolutions,
      })
    )
    console.log(run(['install']))
    if (!addons)
      assert(
        !readdirSync(join(project, '.yarn/cache')).some(name =>
          name.includes('-calendar-')
        )
      )
    console.log(
      run([
        'node',
        '--input-type=module',
        '-e',
        `
      import assert from 'node:assert/strict';
      await import('@formatjs/intl-datetimeformat/polyfill-force.js');
      await import('@formatjs/intl-datetimeformat/locale-data/en.js');
      await import('@formatjs/intl-datetimeformat/add-all-tz.js');
      assert.equal(new Intl.DateTimeFormat('en', {timeZone: 'America/New_York'}).resolvedOptions().calendar, 'gregory');
      if (${addons}) {
        for (const calendar of ['hebrew', 'japanese', 'chinese']) {
          await import('@formatjs/intl-datetimeformat-calendar-' + calendar);
          await import('@formatjs/intl-datetimeformat-calendar-' + calendar + '/locale-data/en.js');
          const formatter = new Intl.DateTimeFormat('en', {calendar, timeZone: 'UTC'});
          assert.equal(formatter.resolvedOptions().calendar, calendar);
          assert(formatter.format(Date.UTC(2024, 2, 11)));
        }
      }
    `,
      ])
    )
  }
} catch (error) {
  if (error.stdout) console.error(String(error.stdout))
  if (error.stderr) console.error(String(error.stderr))
  throw error
} finally {
  rmSync(project, {recursive: true, force: true})
}
