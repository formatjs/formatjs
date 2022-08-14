import {Parser} from '../parser'
import fs from 'fs'
import path from 'path'
import {sync as globSync} from 'fast-glob'
import _ from 'lodash'

const testCases = globSync('test_cases/*', {
  cwd: path.join(__dirname, '../../icu-messageformat-parser-tests'),
  absolute: true,
  dot: false,
})

for (const testCase of testCases) {
  const baseName = path.basename(testCase)
  test(baseName, () => {
    const sections = fs.readFileSync(testCase, 'utf-8').split('\n---\n')
    const message = sections[0]
    const options = JSON.parse(sections[1])
    const expectedResult = JSON.parse(sections[2])

    // Note: allow locale to be specified via an identifier.
    if (options.locale) {
      options.locale = new Intl.Locale(options.locale)
    }

    const parsed = new Parser(message, options).parse()

    // If the mismatch is intentional, use `UPDATE_SNAPSHOT=1` env var
    // with bazel run to update the snapshot.
    if (process.env.UPDATE_SNAPSHOT) {
      if (_.isEqual(parsed, expectedResult)) {
        fs.writeFileSync(
          [
            message,
            JSON.stringify(options, null, 2),
            JSON.stringify(expectedResult, null, 2),
          ].join('\n---\n'),
          'utf-8'
        )
        console.log(`Updated snapshot in ${baseName}`)
      }
    } else {
      expect(parsed).toEqual(expectedResult)
    }
  })
}
